-- SPEC 19: adjust logged time on a dev board ticket.
-- Additive migration: creates one SECURITY DEFINER RPC. No table, RLS or existing grant changes.
-- Actions:
--   stop_at           retro-stop a running timer at a chosen past time (leaves the ticket paused)
--   set_last_duration rewrite the duration of the most recent time entry (0 removes it)
--   delete_last       remove the most recent time entry
--   set_total         set total_elapsed_ms directly, only when the ticket has no time entries
-- Every mutation recomputes total_elapsed_ms from the ticket time entries (single source of
-- truth) and appends an audit comment when the logged duration changes.

CREATE OR REPLACE FUNCTION public.adjust_dev_board_ticket_time(
  p_ticket_id UUID,
  p_action TEXT,
  p_ended_at TIMESTAMPTZ DEFAULT NULL,
  p_duration_ms BIGINT DEFAULT NULL
)
RETURNS public.dev_board_tickets
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_now TIMESTAMPTZ := clock_timestamp();
  v_previous public.dev_board_tickets;
  v_ticket public.dev_board_tickets;
  v_entry public.dev_board_time_entries;
  v_ended_at TIMESTAMPTZ;
  v_duration BIGINT;
  v_before BIGINT := 0;
  v_after BIGINT := 0;
  v_before_min BIGINT;
  v_after_min BIGINT;
  v_before_text TEXT;
  v_after_text TEXT;
  v_comment TEXT;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT * INTO v_previous
  FROM public.dev_board_tickets
  WHERE id = p_ticket_id AND user_id = v_user_id
  FOR UPDATE;

  IF v_previous.id IS NULL THEN
    RAISE EXCEPTION 'Ticket not found';
  END IF;

  IF p_action = 'stop_at' THEN
    IF v_previous.column_id NOT IN ('in_progress', 'validation') THEN
      RAISE EXCEPTION 'Only in-progress or validation tickets have timers';
    END IF;
    IF v_previous.timer_started_at IS NULL THEN
      RAISE EXCEPTION 'Timer is not running';
    END IF;
    IF p_ended_at IS NULL THEN
      RAISE EXCEPTION 'End time is required';
    END IF;
    IF p_ended_at < v_previous.timer_started_at THEN
      RAISE EXCEPTION 'End time cannot be before the timer started';
    END IF;
    IF p_ended_at > v_now + interval '1 minute' THEN
      RAISE EXCEPTION 'End time cannot be in the future';
    END IF;

    -- Small client/server clock skew is clamped instead of rejected.
    v_ended_at := LEAST(p_ended_at, v_now);
    v_duration := GREATEST(0, floor(extract(epoch FROM (v_ended_at - v_previous.timer_started_at)) * 1000)::BIGINT);

    INSERT INTO public.dev_board_time_entries (
      user_id, ticket_id, started_at, ended_at, duration_ms
    ) VALUES (
      v_user_id, p_ticket_id, v_previous.timer_started_at, v_ended_at, v_duration
    );

    UPDATE public.dev_board_tickets
    SET
      timer_started_at = NULL,
      is_paused = true,
      total_elapsed_ms = COALESCE((
        SELECT SUM(duration_ms) FROM public.dev_board_time_entries WHERE ticket_id = p_ticket_id
      ), 0)
    WHERE id = p_ticket_id
    RETURNING * INTO v_ticket;

    INSERT INTO public.dev_board_events (
      user_id, ticket_id, event_type, from_column, to_column, occurred_at
    ) VALUES (
      v_user_id, p_ticket_id, 'paused', v_previous.column_id, v_previous.column_id, v_now
    );

    -- Pausing at "now" is a normal pause; only a retro-stop changes the logged duration.
    IF v_now - v_ended_at > interval '1 minute' THEN
      v_before := GREATEST(0, floor(extract(epoch FROM (v_now - v_previous.timer_started_at)) * 1000)::BIGINT);
      v_after := v_duration;
      v_before_min := (v_before + 30000) / 60000;
      v_after_min := (v_after + 30000) / 60000;
      v_before_text := CASE
        WHEN v_before_min >= 60 THEN (v_before_min / 60)::TEXT || 'h ' || lpad((v_before_min % 60)::TEXT, 2, '0') || 'm'
        ELSE v_before_min::TEXT || 'm'
      END;
      v_after_text := CASE
        WHEN v_after_min >= 60 THEN (v_after_min / 60)::TEXT || 'h ' || lpad((v_after_min % 60)::TEXT, 2, '0') || 'm'
        ELSE v_after_min::TEXT || 'm'
      END;
      v_comment := 'Timer adjusted: ' || v_before_text || ' → ' || v_after_text;

      INSERT INTO public.dev_board_ticket_comments (user_id, ticket_id, body, author)
      VALUES (v_user_id, p_ticket_id, v_comment, 'user');
    END IF;

    RETURN v_ticket;
  ELSIF p_action = 'set_last_duration' THEN
    IF p_duration_ms IS NULL OR p_duration_ms < 0 THEN
      RAISE EXCEPTION 'Duration must be zero or greater';
    END IF;

    SELECT * INTO v_entry
    FROM public.dev_board_time_entries
    WHERE ticket_id = p_ticket_id
    ORDER BY started_at DESC, id DESC
    LIMIT 1;

    IF v_entry.id IS NULL THEN
      RAISE EXCEPTION 'Ticket has no time entries';
    END IF;

    v_ended_at := v_entry.started_at + (p_duration_ms::TEXT || ' milliseconds')::INTERVAL;
    IF v_ended_at > v_now + interval '1 minute' THEN
      RAISE EXCEPTION 'Duration ends in the future';
    END IF;

    v_before := v_entry.duration_ms;
    v_after := p_duration_ms;
    v_before_min := (v_before + 30000) / 60000;
    v_before_text := CASE
      WHEN v_before_min >= 60 THEN (v_before_min / 60)::TEXT || 'h ' || lpad((v_before_min % 60)::TEXT, 2, '0') || 'm'
      ELSE v_before_min::TEXT || 'm'
    END;

    IF p_duration_ms = 0 THEN
      DELETE FROM public.dev_board_time_entries WHERE id = v_entry.id;
      v_comment := 'Timer adjusted: ' || v_before_text || ' → removed';
    ELSE
      UPDATE public.dev_board_time_entries
      SET ended_at = v_ended_at, duration_ms = p_duration_ms
      WHERE id = v_entry.id;

      v_after_min := (v_after + 30000) / 60000;
      v_after_text := CASE
        WHEN v_after_min >= 60 THEN (v_after_min / 60)::TEXT || 'h ' || lpad((v_after_min % 60)::TEXT, 2, '0') || 'm'
        ELSE v_after_min::TEXT || 'm'
      END;
      v_comment := 'Timer adjusted: ' || v_before_text || ' → ' || v_after_text;
    END IF;

    UPDATE public.dev_board_tickets
    SET total_elapsed_ms = COALESCE((
      SELECT SUM(duration_ms) FROM public.dev_board_time_entries WHERE ticket_id = p_ticket_id
    ), 0)
    WHERE id = p_ticket_id
    RETURNING * INTO v_ticket;

    INSERT INTO public.dev_board_ticket_comments (user_id, ticket_id, body, author)
    VALUES (v_user_id, p_ticket_id, v_comment, 'user');

    RETURN v_ticket;
  ELSIF p_action = 'delete_last' THEN
    SELECT * INTO v_entry
    FROM public.dev_board_time_entries
    WHERE ticket_id = p_ticket_id
    ORDER BY started_at DESC, id DESC
    LIMIT 1;

    IF v_entry.id IS NULL THEN
      RAISE EXCEPTION 'Ticket has no time entries';
    END IF;

    DELETE FROM public.dev_board_time_entries WHERE id = v_entry.id;

    UPDATE public.dev_board_tickets
    SET total_elapsed_ms = COALESCE((
      SELECT SUM(duration_ms) FROM public.dev_board_time_entries WHERE ticket_id = p_ticket_id
    ), 0)
    WHERE id = p_ticket_id
    RETURNING * INTO v_ticket;

    v_before := v_entry.duration_ms;
    v_before_min := (v_before + 30000) / 60000;
    v_before_text := CASE
      WHEN v_before_min >= 60 THEN (v_before_min / 60)::TEXT || 'h ' || lpad((v_before_min % 60)::TEXT, 2, '0') || 'm'
      ELSE v_before_min::TEXT || 'm'
    END;
    v_comment := 'Timer adjusted: ' || v_before_text || ' → removed';

    INSERT INTO public.dev_board_ticket_comments (user_id, ticket_id, body, author)
    VALUES (v_user_id, p_ticket_id, v_comment, 'user');

    RETURN v_ticket;
  ELSIF p_action = 'set_total' THEN
    IF p_duration_ms IS NULL OR p_duration_ms < 0 THEN
      RAISE EXCEPTION 'Duration must be zero or greater';
    END IF;
    IF EXISTS (
      SELECT 1 FROM public.dev_board_time_entries WHERE ticket_id = p_ticket_id
    ) THEN
      RAISE EXCEPTION 'Ticket has time entries; edit the last session instead';
    END IF;

    v_before := v_previous.total_elapsed_ms;
    v_after := p_duration_ms;

    UPDATE public.dev_board_tickets
    SET total_elapsed_ms = p_duration_ms
    WHERE id = p_ticket_id
    RETURNING * INTO v_ticket;

    IF v_before IS DISTINCT FROM v_after THEN
      v_before_min := (v_before + 30000) / 60000;
      v_after_min := (v_after + 30000) / 60000;
      v_before_text := CASE
        WHEN v_before_min >= 60 THEN (v_before_min / 60)::TEXT || 'h ' || lpad((v_before_min % 60)::TEXT, 2, '0') || 'm'
        ELSE v_before_min::TEXT || 'm'
      END;
      v_after_text := CASE
        WHEN v_after_min >= 60 THEN (v_after_min / 60)::TEXT || 'h ' || lpad((v_after_min % 60)::TEXT, 2, '0') || 'm'
        ELSE v_after_min::TEXT || 'm'
      END;
      v_comment := 'Timer adjusted: ' || v_before_text || ' → ' || v_after_text;

      INSERT INTO public.dev_board_ticket_comments (user_id, ticket_id, body, author)
      VALUES (v_user_id, p_ticket_id, v_comment, 'user');
    END IF;

    RETURN v_ticket;
  ELSE
    RAISE EXCEPTION 'Unsupported timer adjustment action';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.adjust_dev_board_ticket_time(UUID, TEXT, TIMESTAMPTZ, BIGINT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.adjust_dev_board_ticket_time(UUID, TEXT, TIMESTAMPTZ, BIGINT) TO authenticated;

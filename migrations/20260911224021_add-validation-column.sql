-- Add 'validation' column state between in_progress and review.
-- Timer-active columns become {in_progress, validation}: entering either starts the
-- timer, moving between them keeps it running, and leaving both closes the running
-- time entry exactly like in_progress did before. review/done do not count time.

ALTER TABLE public.dev_board_tickets
  DROP CONSTRAINT IF EXISTS dev_board_tickets_column_id_check;
ALTER TABLE public.dev_board_tickets
  ADD CONSTRAINT dev_board_tickets_column_id_check
  CHECK (
    column_id IN ('backlog', 'todo', 'in_progress', 'validation', 'review', 'done')
  );

ALTER TABLE public.dev_board_events
  DROP CONSTRAINT IF EXISTS dev_board_events_from_column_check;
ALTER TABLE public.dev_board_events
  ADD CONSTRAINT dev_board_events_from_column_check
  CHECK (
    from_column IS NULL
    OR from_column IN ('backlog', 'todo', 'in_progress', 'validation', 'review', 'done')
  );

ALTER TABLE public.dev_board_events
  DROP CONSTRAINT IF EXISTS dev_board_events_to_column_check;
ALTER TABLE public.dev_board_events
  ADD CONSTRAINT dev_board_events_to_column_check
  CHECK (
    to_column IS NULL
    OR to_column IN ('backlog', 'todo', 'in_progress', 'validation', 'review', 'done')
  );

CREATE OR REPLACE FUNCTION public.create_dev_board_ticket(
  p_project_id UUID,
  p_title TEXT,
  p_description TEXT,
  p_column_id TEXT,
  p_priority TEXT
)
RETURNS public.dev_board_tickets
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_now TIMESTAMPTZ := clock_timestamp();
  v_position BIGINT;
  v_ticket public.dev_board_tickets;
  v_timer_active BOOLEAN;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.dev_board_projects
    WHERE id = p_project_id AND user_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'Project not found';
  END IF;

  v_timer_active := p_column_id IN ('in_progress', 'validation');

  SELECT COALESCE(MIN(position) - 1024, 0)
  INTO v_position
  FROM public.dev_board_tickets
  WHERE user_id = v_user_id AND project_id = p_project_id AND column_id = p_column_id;

  INSERT INTO public.dev_board_tickets (
    user_id, project_id, title, description, column_id, position, priority,
    timer_started_at, is_paused, last_moved_at
  ) VALUES (
    v_user_id, p_project_id, p_title, p_description, p_column_id, v_position, p_priority,
    CASE WHEN v_timer_active THEN v_now ELSE NULL END,
    false,
    v_now
  ) RETURNING * INTO v_ticket;

  INSERT INTO public.dev_board_events (
    user_id, ticket_id, event_type, from_column, to_column, occurred_at
  ) VALUES (
    v_user_id, v_ticket.id, 'created', NULL, v_ticket.column_id, v_now
  );

  IF v_timer_active THEN
    INSERT INTO public.dev_board_events (
      user_id, ticket_id, event_type, from_column, to_column, occurred_at
    ) VALUES (
      v_user_id, v_ticket.id, 'started', NULL, v_ticket.column_id, v_now
    );
  END IF;

  RETURN v_ticket;
END;
$$;

CREATE OR REPLACE FUNCTION public.move_dev_board_ticket(
  p_ticket_id UUID,
  p_column_id TEXT,
  p_branch TEXT DEFAULT NULL,
  p_pr_url TEXT DEFAULT NULL
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
  v_position BIGINT;
  v_duration BIGINT;
  v_event_type TEXT;
  v_timer_active BOOLEAN;
BEGIN
  SELECT * INTO v_previous
  FROM public.dev_board_tickets
  WHERE id = p_ticket_id AND user_id = v_user_id
  FOR UPDATE;

  IF v_previous.id IS NULL THEN
    RAISE EXCEPTION 'Ticket not found';
  END IF;
  IF v_previous.column_id = p_column_id THEN
    RETURN v_previous;
  END IF;

  v_timer_active := p_column_id IN ('in_progress', 'validation');

  SELECT COALESCE(MIN(position) - 1024, 0)
  INTO v_position
  FROM public.dev_board_tickets
  WHERE user_id = v_user_id
    AND project_id = v_previous.project_id
    AND column_id = p_column_id
    AND id <> p_ticket_id;

  IF v_previous.timer_started_at IS NOT NULL AND NOT v_timer_active THEN
    v_duration := GREATEST(0, floor(extract(epoch FROM (v_now - v_previous.timer_started_at)) * 1000)::BIGINT);
    INSERT INTO public.dev_board_time_entries (
      user_id, ticket_id, started_at, ended_at, duration_ms
    ) VALUES (
      v_user_id, p_ticket_id, v_previous.timer_started_at, v_now, v_duration
    );
  ELSE
    v_duration := 0;
  END IF;

  UPDATE public.dev_board_tickets
  SET
    column_id = p_column_id,
    position = v_position,
    timer_started_at = CASE
      WHEN v_timer_active AND v_previous.timer_started_at IS NULL THEN v_now
      WHEN NOT v_timer_active THEN NULL
      ELSE v_previous.timer_started_at
    END,
    total_elapsed_ms = v_previous.total_elapsed_ms + v_duration,
    is_paused = false,
    last_moved_at = v_now,
    branch = CASE WHEN p_branch IS NULL THEN branch ELSE NULLIF(p_branch, '') END,
    pr_url = CASE WHEN p_pr_url IS NULL THEN pr_url ELSE NULLIF(p_pr_url, '') END
  WHERE id = p_ticket_id
  RETURNING * INTO v_ticket;

  v_event_type := CASE
    WHEN p_column_id = 'done' THEN 'completed'
    WHEN v_timer_active AND v_previous.timer_started_at IS NULL THEN 'started'
    ELSE 'moved'
  END;

  INSERT INTO public.dev_board_events (
    user_id, ticket_id, event_type, from_column, to_column, occurred_at
  ) VALUES (
    v_user_id, p_ticket_id, v_event_type, v_previous.column_id, p_column_id, v_now
  );

  RETURN v_ticket;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_dev_board_ticket_timer(
  p_ticket_id UUID,
  p_action TEXT
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
  v_duration BIGINT := 0;
BEGIN
  SELECT * INTO v_previous
  FROM public.dev_board_tickets
  WHERE id = p_ticket_id AND user_id = v_user_id
  FOR UPDATE;

  IF v_previous.id IS NULL THEN
    RAISE EXCEPTION 'Ticket not found';
  END IF;
  IF v_previous.column_id NOT IN ('in_progress', 'validation') THEN
    RAISE EXCEPTION 'Only in-progress or validation tickets have timers';
  END IF;

  IF p_action = 'pause' THEN
    IF v_previous.timer_started_at IS NULL THEN
      RAISE EXCEPTION 'Timer is not running';
    END IF;
    v_duration := GREATEST(0, floor(extract(epoch FROM (v_now - v_previous.timer_started_at)) * 1000)::BIGINT);
    INSERT INTO public.dev_board_time_entries (
      user_id, ticket_id, started_at, ended_at, duration_ms
    ) VALUES (
      v_user_id, p_ticket_id, v_previous.timer_started_at, v_now, v_duration
    );
    UPDATE public.dev_board_tickets
    SET timer_started_at = NULL,
        total_elapsed_ms = total_elapsed_ms + v_duration,
        is_paused = true
    WHERE id = p_ticket_id
    RETURNING * INTO v_ticket;
  ELSIF p_action = 'resume' THEN
    IF v_previous.timer_started_at IS NOT NULL OR NOT v_previous.is_paused THEN
      RAISE EXCEPTION 'Timer is not paused';
    END IF;
    UPDATE public.dev_board_tickets
    SET timer_started_at = v_now, is_paused = false
    WHERE id = p_ticket_id
    RETURNING * INTO v_ticket;
  ELSE
    RAISE EXCEPTION 'Unsupported timer action';
  END IF;

  INSERT INTO public.dev_board_events (
    user_id, ticket_id, event_type, from_column, to_column, occurred_at
  ) VALUES (
    v_user_id,
    p_ticket_id,
    CASE WHEN p_action = 'pause' THEN 'paused' ELSE 'resumed' END,
    v_previous.column_id,
    v_previous.column_id,
    v_now
  );

  RETURN v_ticket;
END;
$$;

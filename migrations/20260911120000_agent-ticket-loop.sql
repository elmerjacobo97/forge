-- Agent ticket loop: ticket comments, branch/PR handoff fields, extended RPCs.

ALTER TABLE public.dev_board_tickets
  ADD COLUMN branch TEXT CHECK (branch IS NULL OR char_length(branch) BETWEEN 1 AND 200),
  ADD COLUMN pr_url TEXT CHECK (
    pr_url IS NULL OR (char_length(pr_url) <= 2048 AND pr_url ~* '^https?://')
  );

CREATE TABLE IF NOT EXISTS public.dev_board_ticket_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  ticket_id UUID NOT NULL REFERENCES public.dev_board_tickets(id) ON DELETE CASCADE,
  body TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 5000),
  author TEXT NOT NULL DEFAULT 'user' CHECK (author IN ('user', 'agent')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS dev_board_ticket_comments_ticket_created_idx
  ON public.dev_board_ticket_comments (ticket_id, created_at);

DROP TRIGGER IF EXISTS dev_board_ticket_comments_prevent_user_change
  ON public.dev_board_ticket_comments;
CREATE TRIGGER dev_board_ticket_comments_prevent_user_change
  BEFORE UPDATE ON public.dev_board_ticket_comments
  FOR EACH ROW EXECUTE FUNCTION public.prevent_user_id_change();

ALTER TABLE public.dev_board_ticket_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS dev_board_ticket_comments_select_own ON public.dev_board_ticket_comments;
DROP POLICY IF EXISTS dev_board_ticket_comments_insert_own ON public.dev_board_ticket_comments;
DROP POLICY IF EXISTS dev_board_ticket_comments_update_own ON public.dev_board_ticket_comments;
DROP POLICY IF EXISTS dev_board_ticket_comments_delete_own ON public.dev_board_ticket_comments;

CREATE POLICY dev_board_ticket_comments_select_own ON public.dev_board_ticket_comments
  FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
CREATE POLICY dev_board_ticket_comments_insert_own ON public.dev_board_ticket_comments
  FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY dev_board_ticket_comments_update_own ON public.dev_board_ticket_comments
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY dev_board_ticket_comments_delete_own ON public.dev_board_ticket_comments
  FOR DELETE TO authenticated USING (user_id = (SELECT auth.uid()));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.dev_board_ticket_comments TO authenticated;

DROP FUNCTION IF EXISTS public.update_dev_board_ticket(UUID, TEXT, TEXT, TEXT);
CREATE FUNCTION public.update_dev_board_ticket(
  p_ticket_id UUID,
  p_title TEXT,
  p_description TEXT,
  p_priority TEXT,
  p_branch TEXT DEFAULT NULL,
  p_pr_url TEXT DEFAULT NULL
)
RETURNS public.dev_board_tickets
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  v_ticket public.dev_board_tickets;
BEGIN
  UPDATE public.dev_board_tickets
  SET
    title = p_title,
    description = p_description,
    priority = p_priority,
    branch = CASE WHEN p_branch IS NULL THEN branch ELSE NULLIF(p_branch, '') END,
    pr_url = CASE WHEN p_pr_url IS NULL THEN pr_url ELSE NULLIF(p_pr_url, '') END
  WHERE id = p_ticket_id AND user_id = auth.uid()
  RETURNING * INTO v_ticket;

  IF v_ticket.id IS NULL THEN
    RAISE EXCEPTION 'Ticket not found';
  END IF;
  RETURN v_ticket;
END;
$$;

DROP FUNCTION IF EXISTS public.move_dev_board_ticket(UUID, TEXT);
CREATE FUNCTION public.move_dev_board_ticket(
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

  SELECT COALESCE(MIN(position) - 1024, 0)
  INTO v_position
  FROM public.dev_board_tickets
  WHERE user_id = v_user_id
    AND project_id = v_previous.project_id
    AND column_id = p_column_id
    AND id <> p_ticket_id;

  IF v_previous.timer_started_at IS NOT NULL AND p_column_id <> 'in_progress' THEN
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
      WHEN p_column_id = 'in_progress' AND v_previous.timer_started_at IS NULL THEN v_now
      WHEN p_column_id <> 'in_progress' THEN NULL
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
    WHEN p_column_id = 'in_progress' THEN 'started'
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

REVOKE ALL ON FUNCTION public.update_dev_board_ticket(UUID, TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.move_dev_board_ticket(UUID, TEXT, TEXT, TEXT) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.update_dev_board_ticket(UUID, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.move_dev_board_ticket(UUID, TEXT, TEXT, TEXT) TO authenticated;

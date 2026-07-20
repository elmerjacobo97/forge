CREATE TABLE public.bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 200),
  url TEXT NOT NULL CHECK (char_length(url) BETWEEN 1 AND 2048),
  category TEXT NOT NULL CHECK (category IN ('docs', 'git', 'tool', 'article', 'other')),
  description TEXT NOT NULL DEFAULT '' CHECK (char_length(description) <= 2000),
  tags TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.snippets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 200),
  kind TEXT NOT NULL CHECK (kind IN ('note', 'prompt', 'config', 'snippet')),
  content TEXT NOT NULL CHECK (char_length(content) <= 100000),
  language TEXT CHECK (language IS NULL OR char_length(language) <= 100),
  tags TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.dev_board_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 120),
  description TEXT NOT NULL DEFAULT '' CHECK (char_length(description) <= 2000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.dev_board_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.dev_board_projects(id) ON DELETE RESTRICT,
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 200),
  description TEXT NOT NULL DEFAULT '' CHECK (char_length(description) <= 10000),
  column_id TEXT NOT NULL CHECK (column_id IN ('backlog', 'todo', 'in_progress', 'review', 'done')),
  position BIGINT NOT NULL,
  priority TEXT NOT NULL CHECK (priority IN ('low', 'med', 'high')),
  timer_started_at TIMESTAMPTZ,
  total_elapsed_ms BIGINT NOT NULL DEFAULT 0 CHECK (total_elapsed_ms >= 0),
  is_paused BOOLEAN NOT NULL DEFAULT false,
  last_moved_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (NOT is_paused OR timer_started_at IS NULL)
);

CREATE TABLE public.dev_board_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ticket_id UUID NOT NULL REFERENCES public.dev_board_tickets(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('created', 'moved', 'started', 'completed', 'paused', 'resumed')),
  from_column TEXT CHECK (from_column IS NULL OR from_column IN ('backlog', 'todo', 'in_progress', 'review', 'done')),
  to_column TEXT CHECK (to_column IS NULL OR to_column IN ('backlog', 'todo', 'in_progress', 'review', 'done')),
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.dev_board_time_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ticket_id UUID NOT NULL REFERENCES public.dev_board_tickets(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ NOT NULL,
  duration_ms BIGINT NOT NULL CHECK (duration_ms >= 0),
  CHECK (ended_at >= started_at)
);

CREATE INDEX bookmarks_user_created_idx ON public.bookmarks (user_id, created_at DESC);
CREATE INDEX snippets_user_created_idx ON public.snippets (user_id, created_at DESC);
CREATE INDEX dev_board_projects_user_created_idx ON public.dev_board_projects (user_id, created_at DESC);
CREATE INDEX dev_board_tickets_project_column_position_idx
  ON public.dev_board_tickets (user_id, project_id, column_id, position DESC);
CREATE INDEX dev_board_events_user_occurred_idx ON public.dev_board_events (user_id, occurred_at DESC);
CREATE INDEX dev_board_events_ticket_idx ON public.dev_board_events (ticket_id);
CREATE INDEX dev_board_time_entries_user_started_idx
  ON public.dev_board_time_entries (user_id, started_at DESC);
CREATE INDEX dev_board_time_entries_ticket_idx ON public.dev_board_time_entries (ticket_id);

CREATE TRIGGER bookmarks_updated_at
  BEFORE UPDATE ON public.bookmarks
  FOR EACH ROW EXECUTE FUNCTION system.update_updated_at();

CREATE TRIGGER snippets_updated_at
  BEFORE UPDATE ON public.snippets
  FOR EACH ROW EXECUTE FUNCTION system.update_updated_at();

CREATE TRIGGER dev_board_projects_updated_at
  BEFORE UPDATE ON public.dev_board_projects
  FOR EACH ROW EXECUTE FUNCTION system.update_updated_at();

CREATE TRIGGER dev_board_tickets_updated_at
  BEFORE UPDATE ON public.dev_board_tickets
  FOR EACH ROW EXECUTE FUNCTION system.update_updated_at();

CREATE OR REPLACE FUNCTION public.prevent_user_id_change()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    RAISE EXCEPTION 'user_id cannot be changed';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER bookmarks_prevent_user_change
  BEFORE UPDATE ON public.bookmarks
  FOR EACH ROW EXECUTE FUNCTION public.prevent_user_id_change();

CREATE TRIGGER snippets_prevent_user_change
  BEFORE UPDATE ON public.snippets
  FOR EACH ROW EXECUTE FUNCTION public.prevent_user_id_change();

CREATE TRIGGER dev_board_projects_prevent_user_change
  BEFORE UPDATE ON public.dev_board_projects
  FOR EACH ROW EXECUTE FUNCTION public.prevent_user_id_change();

ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.snippets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dev_board_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dev_board_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dev_board_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dev_board_time_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY bookmarks_select_own ON public.bookmarks
  FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
CREATE POLICY bookmarks_insert_own ON public.bookmarks
  FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY bookmarks_update_own ON public.bookmarks
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY bookmarks_delete_own ON public.bookmarks
  FOR DELETE TO authenticated USING (user_id = (SELECT auth.uid()));

CREATE POLICY snippets_select_own ON public.snippets
  FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
CREATE POLICY snippets_insert_own ON public.snippets
  FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY snippets_update_own ON public.snippets
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY snippets_delete_own ON public.snippets
  FOR DELETE TO authenticated USING (user_id = (SELECT auth.uid()));

CREATE POLICY dev_board_projects_select_own ON public.dev_board_projects
  FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
CREATE POLICY dev_board_projects_insert_own ON public.dev_board_projects
  FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY dev_board_projects_update_own ON public.dev_board_projects
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY dev_board_projects_delete_own ON public.dev_board_projects
  FOR DELETE TO authenticated USING (user_id = (SELECT auth.uid()));

CREATE POLICY dev_board_tickets_select_own ON public.dev_board_tickets
  FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
CREATE POLICY dev_board_events_select_own ON public.dev_board_events
  FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
CREATE POLICY dev_board_time_entries_select_own ON public.dev_board_time_entries
  FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bookmarks TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.snippets TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dev_board_projects TO authenticated;
GRANT SELECT ON public.dev_board_tickets TO authenticated;
GRANT SELECT ON public.dev_board_events TO authenticated;
GRANT SELECT ON public.dev_board_time_entries TO authenticated;

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

  SELECT COALESCE(MIN(position) - 1024, 0)
  INTO v_position
  FROM public.dev_board_tickets
  WHERE user_id = v_user_id AND project_id = p_project_id AND column_id = p_column_id;

  INSERT INTO public.dev_board_tickets (
    user_id, project_id, title, description, column_id, position, priority,
    timer_started_at, is_paused, last_moved_at
  ) VALUES (
    v_user_id, p_project_id, p_title, p_description, p_column_id, v_position, p_priority,
    CASE WHEN p_column_id = 'in_progress' THEN v_now ELSE NULL END,
    false,
    v_now
  ) RETURNING * INTO v_ticket;

  INSERT INTO public.dev_board_events (
    user_id, ticket_id, event_type, from_column, to_column, occurred_at
  ) VALUES (
    v_user_id, v_ticket.id, 'created', NULL, v_ticket.column_id, v_now
  );

  IF p_column_id = 'in_progress' THEN
    INSERT INTO public.dev_board_events (
      user_id, ticket_id, event_type, from_column, to_column, occurred_at
    ) VALUES (
      v_user_id, v_ticket.id, 'started', NULL, v_ticket.column_id, v_now
    );
  END IF;

  RETURN v_ticket;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_dev_board_ticket(
  p_ticket_id UUID,
  p_title TEXT,
  p_description TEXT,
  p_priority TEXT
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
  SET title = p_title, description = p_description, priority = p_priority
  WHERE id = p_ticket_id AND user_id = auth.uid()
  RETURNING * INTO v_ticket;

  IF v_ticket.id IS NULL THEN
    RAISE EXCEPTION 'Ticket not found';
  END IF;
  RETURN v_ticket;
END;
$$;

CREATE OR REPLACE FUNCTION public.move_dev_board_ticket(
  p_ticket_id UUID,
  p_column_id TEXT
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
    last_moved_at = v_now
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
  IF v_previous.column_id <> 'in_progress' THEN
    RAISE EXCEPTION 'Only in-progress tickets have timers';
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

CREATE OR REPLACE FUNCTION public.delete_dev_board_ticket(p_ticket_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
BEGIN
  DELETE FROM public.dev_board_tickets
  WHERE id = p_ticket_id AND user_id = auth.uid();
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ticket not found';
  END IF;
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_empty_dev_board_project(p_project_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.dev_board_tickets
    WHERE project_id = p_project_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Project has tickets';
  END IF;
  DELETE FROM public.dev_board_projects
  WHERE id = p_project_id AND user_id = auth.uid();
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Project not found';
  END IF;
  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.create_dev_board_ticket(UUID, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.update_dev_board_ticket(UUID, TEXT, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.move_dev_board_ticket(UUID, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.set_dev_board_ticket_timer(UUID, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.delete_dev_board_ticket(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.delete_empty_dev_board_project(UUID) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.create_dev_board_ticket(UUID, TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_dev_board_ticket(UUID, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.move_dev_board_ticket(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_dev_board_ticket_timer(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_dev_board_ticket(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_empty_dev_board_project(UUID) TO authenticated;

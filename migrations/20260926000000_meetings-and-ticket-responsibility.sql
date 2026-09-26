-- Private meeting notes, action items, and optional ticket responsibility.
ALTER TABLE public.dev_board_tickets
  ADD COLUMN responsible_name TEXT
  CHECK (
    responsible_name IS NULL
    OR (char_length(responsible_name) <= 120 AND btrim(responsible_name) <> '')
  );

CREATE TABLE public.meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID NULL REFERENCES public.dev_board_projects(id) ON DELETE SET NULL,
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 200),
  meeting_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  attendees TEXT[] NOT NULL DEFAULT '{}',
  context TEXT NOT NULL DEFAULT '',
  decisions TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.meeting_action_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 120),
  details TEXT NOT NULL DEFAULT '' CHECK (char_length(details) <= 2000),
  responsible_name TEXT NULL
    CHECK (responsible_name IS NULL OR char_length(responsible_name) <= 120),
  due_date DATE NULL,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  ticket_id UUID NULL REFERENCES public.dev_board_tickets(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX meetings_user_meeting_at_idx
  ON public.meetings (user_id, meeting_at DESC, id DESC);
CREATE INDEX meetings_project_meeting_at_idx
  ON public.meetings (project_id, meeting_at DESC, id DESC);
CREATE INDEX meeting_action_items_meeting_created_idx
  ON public.meeting_action_items (meeting_id, created_at, id);
CREATE INDEX meeting_action_items_ticket_idx
  ON public.meeting_action_items (ticket_id) WHERE ticket_id IS NOT NULL;

CREATE TRIGGER meetings_updated_at
  BEFORE UPDATE ON public.meetings
  FOR EACH ROW EXECUTE FUNCTION system.update_updated_at();
CREATE TRIGGER meeting_action_items_updated_at
  BEFORE UPDATE ON public.meeting_action_items
  FOR EACH ROW EXECUTE FUNCTION system.update_updated_at();
CREATE TRIGGER meetings_prevent_user_change
  BEFORE UPDATE ON public.meetings
  FOR EACH ROW EXECUTE FUNCTION public.prevent_user_id_change();
CREATE TRIGGER meeting_action_items_prevent_user_change
  BEFORE UPDATE ON public.meeting_action_items
  FOR EACH ROW EXECUTE FUNCTION public.prevent_user_id_change();

-- Keep free-text responsible names normalized for direct table writes too.
CREATE OR REPLACE FUNCTION public.normalize_responsible_name()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, public, pg_temp
AS $$
BEGIN
  NEW.responsible_name := NULLIF(btrim(NEW.responsible_name), '');
  IF NEW.responsible_name IS NOT NULL AND char_length(NEW.responsible_name) > 120 THEN
    RAISE EXCEPTION 'Responsible name must be at most 120 characters';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER dev_board_tickets_normalize_responsible
  BEFORE INSERT OR UPDATE OF responsible_name ON public.dev_board_tickets
  FOR EACH ROW EXECUTE FUNCTION public.normalize_responsible_name();
CREATE TRIGGER meeting_action_items_normalize_responsible
  BEFORE INSERT OR UPDATE OF responsible_name ON public.meeting_action_items
  FOR EACH ROW EXECUTE FUNCTION public.normalize_responsible_name();

-- Enforce ownership across references even when rows are written directly.
CREATE OR REPLACE FUNCTION public.validate_meeting_references()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
BEGIN
  IF TG_TABLE_NAME = 'meetings' THEN
    IF NEW.project_id IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM public.dev_board_projects p
      WHERE p.id = NEW.project_id AND p.user_id = NEW.user_id
    ) THEN
      RAISE EXCEPTION 'Project not found';
    END IF;
  ELSE
    IF NOT EXISTS (
      SELECT 1 FROM public.meetings m
      WHERE m.id = NEW.meeting_id AND m.user_id = NEW.user_id
    ) THEN
      RAISE EXCEPTION 'Meeting not found';
    END IF;
    IF NEW.ticket_id IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM public.dev_board_tickets t
      WHERE t.id = NEW.ticket_id AND t.user_id = NEW.user_id
    ) THEN
      RAISE EXCEPTION 'Ticket not found';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER meetings_validate_references
  BEFORE INSERT OR UPDATE OF project_id, user_id ON public.meetings
  FOR EACH ROW EXECUTE FUNCTION public.validate_meeting_references();
CREATE TRIGGER meeting_action_items_validate_references
  BEFORE INSERT OR UPDATE OF meeting_id, ticket_id, user_id ON public.meeting_action_items
  FOR EACH ROW EXECUTE FUNCTION public.validate_meeting_references();

ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_action_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY meetings_select_own ON public.meetings
  FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
CREATE POLICY meetings_insert_own ON public.meetings
  FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY meetings_update_own ON public.meetings
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY meetings_delete_own ON public.meetings
  FOR DELETE TO authenticated USING (user_id = (SELECT auth.uid()));

CREATE POLICY meeting_action_items_select_own ON public.meeting_action_items
  FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
CREATE POLICY meeting_action_items_insert_own ON public.meeting_action_items
  FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY meeting_action_items_update_own ON public.meeting_action_items
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY meeting_action_items_delete_own ON public.meeting_action_items
  FOR DELETE TO authenticated USING (user_id = (SELECT auth.uid()));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.meetings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.meeting_action_items TO authenticated;

-- Preserve the original ticket RPC call shapes while appending an optional field.
DROP FUNCTION public.create_dev_board_ticket(UUID, TEXT, TEXT, TEXT, TEXT);
CREATE FUNCTION public.create_dev_board_ticket(
  p_project_id UUID,
  p_title TEXT,
  p_description TEXT,
  p_column_id TEXT,
  p_priority TEXT,
  p_responsible_name TEXT DEFAULT NULL
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
  SELECT COALESCE(MIN(position) - 1024, 0) INTO v_position
  FROM public.dev_board_tickets
  WHERE user_id = v_user_id AND project_id = p_project_id AND column_id = p_column_id;

  INSERT INTO public.dev_board_tickets (
    user_id, project_id, title, description, column_id, position, priority,
    timer_started_at, is_paused, last_moved_at, responsible_name
  ) VALUES (
    v_user_id, p_project_id, p_title, p_description, p_column_id, v_position, p_priority,
    CASE WHEN v_timer_active THEN v_now ELSE NULL END, false, v_now, p_responsible_name
  ) RETURNING * INTO v_ticket;

  INSERT INTO public.dev_board_events (
    user_id, ticket_id, event_type, from_column, to_column, occurred_at
  ) VALUES (v_user_id, v_ticket.id, 'created', NULL, v_ticket.column_id, v_now);

  IF v_timer_active THEN
    INSERT INTO public.dev_board_events (
      user_id, ticket_id, event_type, from_column, to_column, occurred_at
    ) VALUES (v_user_id, v_ticket.id, 'started', NULL, v_ticket.column_id, v_now);
  END IF;
  RETURN v_ticket;
END;
$$;

DROP FUNCTION public.update_dev_board_ticket(UUID, TEXT, TEXT, TEXT, TEXT, TEXT);
CREATE FUNCTION public.update_dev_board_ticket(
  p_ticket_id UUID,
  p_title TEXT,
  p_description TEXT,
  p_priority TEXT,
  p_branch TEXT DEFAULT NULL,
  p_pr_url TEXT DEFAULT NULL,
  p_responsible_name TEXT DEFAULT NULL
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
    pr_url = CASE WHEN p_pr_url IS NULL THEN pr_url ELSE NULLIF(p_pr_url, '') END,
    responsible_name = CASE
      WHEN p_responsible_name IS NULL THEN responsible_name
      ELSE NULLIF(btrim(p_responsible_name), '')
    END
  WHERE id = p_ticket_id AND user_id = auth.uid()
  RETURNING * INTO v_ticket;

  IF v_ticket.id IS NULL THEN
    RAISE EXCEPTION 'Ticket not found';
  END IF;
  RETURN v_ticket;
END;
$$;

CREATE FUNCTION public.create_dev_board_ticket_from_meeting_action(
  p_action_item_id UUID,
  p_project_id UUID DEFAULT NULL
)
RETURNS public.dev_board_tickets
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_action public.meeting_action_items;
  v_meeting public.meetings;
  v_project_id UUID;
  v_ticket public.dev_board_tickets;
  v_now TIMESTAMPTZ := clock_timestamp();
  v_position BIGINT;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT a.* INTO v_action
  FROM public.meeting_action_items a
  WHERE a.id = p_action_item_id AND a.user_id = v_user_id
  FOR UPDATE;
  IF v_action.id IS NULL THEN
    RAISE EXCEPTION 'Action item not found';
  END IF;

  IF v_action.ticket_id IS NOT NULL THEN
    SELECT t.* INTO v_ticket
    FROM public.dev_board_tickets t
    WHERE t.id = v_action.ticket_id AND t.user_id = v_user_id;
    IF v_ticket.id IS NOT NULL THEN
      RETURN v_ticket;
    END IF;
  END IF;

  SELECT m.* INTO v_meeting
  FROM public.meetings m
  WHERE m.id = v_action.meeting_id AND m.user_id = v_user_id;
  IF v_meeting.id IS NULL THEN
    RAISE EXCEPTION 'Meeting not found';
  END IF;

  v_project_id := COALESCE(v_meeting.project_id, p_project_id);
  IF v_project_id IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.dev_board_projects p
    WHERE p.id = v_project_id AND p.user_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'Project not found';
  END IF;
  IF v_meeting.project_id IS NOT NULL AND p_project_id IS NOT NULL
     AND p_project_id <> v_meeting.project_id THEN
    RAISE EXCEPTION 'Meeting project cannot be changed during conversion';
  END IF;

  SELECT COALESCE(MIN(position) - 1024, 0) INTO v_position
  FROM public.dev_board_tickets
  WHERE user_id = v_user_id AND project_id = v_project_id AND column_id = 'backlog';

  INSERT INTO public.dev_board_tickets (
    user_id, project_id, title, description, column_id, position, priority,
    last_moved_at, responsible_name
  ) VALUES (
    v_user_id, v_project_id, v_action.title, v_action.details, 'backlog', v_position,
    'med', v_now, v_action.responsible_name
  ) RETURNING * INTO v_ticket;

  INSERT INTO public.dev_board_events (
    user_id, ticket_id, event_type, from_column, to_column, occurred_at
  ) VALUES (v_user_id, v_ticket.id, 'created', NULL, 'backlog', v_now);

  UPDATE public.meeting_action_items
  SET ticket_id = v_ticket.id
  WHERE id = v_action.id;
  RETURN v_ticket;
END;
$$;

REVOKE ALL ON FUNCTION public.create_dev_board_ticket(UUID, TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.update_dev_board_ticket(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_dev_board_ticket_from_meeting_action(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_dev_board_ticket(UUID, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_dev_board_ticket(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_dev_board_ticket_from_meeting_action(UUID, UUID) TO authenticated;

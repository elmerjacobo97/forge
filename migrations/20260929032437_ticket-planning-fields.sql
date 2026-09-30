-- Add optional planning fields; existing tickets remain NULL for each field.
ALTER TABLE public.dev_board_tickets
  ADD COLUMN start_date TIMESTAMPTZ NULL,
  ADD COLUMN due_date TIMESTAMPTZ NULL,
  ADD COLUMN complexity TEXT NULL,
  ADD CONSTRAINT dev_board_tickets_complexity_check
    CHECK (complexity IS NULL OR complexity IN ('low', 'medium', 'high')),
  ADD CONSTRAINT dev_board_tickets_date_order_check
    CHECK (start_date IS NULL OR due_date IS NULL OR start_date <= due_date);

-- Keep existing named-argument calls working by appending defaulted parameters.
DROP FUNCTION public.create_dev_board_ticket(UUID, TEXT, TEXT, TEXT, TEXT, TEXT);
CREATE FUNCTION public.create_dev_board_ticket(
  p_project_id UUID,
  p_title TEXT,
  p_description TEXT,
  p_column_id TEXT,
  p_priority TEXT,
  p_responsible_name TEXT DEFAULT NULL,
  p_start_date TIMESTAMPTZ DEFAULT NULL,
  p_due_date TIMESTAMPTZ DEFAULT NULL,
  p_complexity TEXT DEFAULT NULL
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
    timer_started_at, is_paused, last_moved_at, responsible_name,
    start_date, due_date, complexity
  ) VALUES (
    v_user_id, p_project_id, p_title, p_description, p_column_id, v_position, p_priority,
    CASE WHEN v_timer_active THEN v_now ELSE NULL END, false, v_now, p_responsible_name,
    p_start_date, p_due_date, p_complexity
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

DROP FUNCTION public.update_dev_board_ticket(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT);
CREATE FUNCTION public.update_dev_board_ticket(
  p_ticket_id UUID,
  p_title TEXT,
  p_description TEXT,
  p_priority TEXT,
  p_branch TEXT DEFAULT NULL,
  p_pr_url TEXT DEFAULT NULL,
  p_responsible_name TEXT DEFAULT NULL,
  p_start_date TIMESTAMPTZ DEFAULT NULL,
  p_due_date TIMESTAMPTZ DEFAULT NULL,
  p_complexity TEXT DEFAULT NULL,
  p_clear_start_date BOOLEAN DEFAULT FALSE,
  p_clear_due_date BOOLEAN DEFAULT FALSE,
  p_clear_complexity BOOLEAN DEFAULT FALSE
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
    END,
    start_date = CASE
      WHEN p_clear_start_date THEN NULL
      WHEN p_start_date IS NOT NULL THEN p_start_date
      ELSE start_date
    END,
    due_date = CASE
      WHEN p_clear_due_date THEN NULL
      WHEN p_due_date IS NOT NULL THEN p_due_date
      ELSE due_date
    END,
    complexity = CASE
      WHEN p_clear_complexity THEN NULL
      WHEN p_complexity IS NOT NULL THEN p_complexity
      ELSE complexity
    END
  WHERE id = p_ticket_id AND user_id = auth.uid()
  RETURNING * INTO v_ticket;

  IF v_ticket.id IS NULL THEN
    RAISE EXCEPTION 'Ticket not found';
  END IF;
  RETURN v_ticket;
END;
$$;

REVOKE ALL ON FUNCTION public.create_dev_board_ticket(
  UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TIMESTAMPTZ, TIMESTAMPTZ, TEXT
) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.update_dev_board_ticket(
  UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TIMESTAMPTZ, TIMESTAMPTZ, TEXT, BOOLEAN, BOOLEAN, BOOLEAN
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_dev_board_ticket(
  UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TIMESTAMPTZ, TIMESTAMPTZ, TEXT
) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_dev_board_ticket(
  UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TIMESTAMPTZ, TIMESTAMPTZ, TEXT, BOOLEAN, BOOLEAN, BOOLEAN
) TO authenticated;

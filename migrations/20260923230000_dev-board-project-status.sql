ALTER TABLE public.dev_board_projects
  ADD COLUMN status TEXT NOT NULL DEFAULT 'planned'
  CHECK (status IN ('planned', 'in_progress', 'paused', 'completed', 'archived'));

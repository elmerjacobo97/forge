-- Order Dev Board tickets by creation date (newest first) in every column.

CREATE INDEX IF NOT EXISTS dev_board_tickets_project_column_created_idx
  ON public.dev_board_tickets (user_id, project_id, column_id, created_at DESC);

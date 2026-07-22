ALTER TABLE public.snippets
  ADD COLUMN tool TEXT NULL,
  ADD COLUMN custom_tool TEXT NULL,
  ADD COLUMN version TEXT NULL,
  ADD COLUMN context TEXT NULL;

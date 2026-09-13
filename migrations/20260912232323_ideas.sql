-- Ideas tool: private per-user idea capture with lifecycle status.

CREATE TABLE IF NOT EXISTS public.ideas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 200),
  content TEXT NOT NULL CHECK (char_length(content) <= 100000),
  status TEXT NOT NULL DEFAULT 'seed'
    CHECK (status IN ('seed', 'exploring', 'building', 'parked', 'shipped')),
  category TEXT NOT NULL DEFAULT 'other'
    CHECK (category IN ('app', 'web', 'mobile', 'business', 'other')),
  tags TEXT[] NOT NULL DEFAULT '{}',
  links TEXT[] NOT NULL DEFAULT '{}'
    CHECK (array_length(links, 1) IS NULL OR array_length(links, 1) <= 10),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ideas_user_id_created_at_idx
  ON public.ideas (user_id, created_at DESC);

DROP TRIGGER IF EXISTS ideas_updated_at ON public.ideas;
CREATE TRIGGER ideas_updated_at
  BEFORE UPDATE ON public.ideas
  FOR EACH ROW EXECUTE FUNCTION system.update_updated_at();

DROP TRIGGER IF EXISTS ideas_prevent_user_change ON public.ideas;
CREATE TRIGGER ideas_prevent_user_change
  BEFORE UPDATE ON public.ideas
  FOR EACH ROW EXECUTE FUNCTION public.prevent_user_id_change();

ALTER TABLE public.ideas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ideas_select_own ON public.ideas;
DROP POLICY IF EXISTS ideas_insert_own ON public.ideas;
DROP POLICY IF EXISTS ideas_update_own ON public.ideas;
DROP POLICY IF EXISTS ideas_delete_own ON public.ideas;

CREATE POLICY ideas_select_own ON public.ideas
  FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
CREATE POLICY ideas_insert_own ON public.ideas
  FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY ideas_update_own ON public.ideas
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY ideas_delete_own ON public.ideas
  FOR DELETE TO authenticated USING (user_id = (SELECT auth.uid()));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ideas TO authenticated;

DROP TABLE IF EXISTS public.snippets CASCADE;

CREATE TABLE IF NOT EXISTS public.resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 200),
  kind TEXT NOT NULL CHECK (kind IN ('note', 'prompt', 'config', 'code')),
  content TEXT NOT NULL CHECK (char_length(content) <= 100000),
  language TEXT CHECK (language IS NULL OR char_length(language) <= 100),
  tags TEXT[] NOT NULL DEFAULT '{}',
  tool TEXT NULL,
  custom_tool TEXT NULL,
  version TEXT NULL,
  context TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS resources_user_created_idx
  ON public.resources (user_id, created_at DESC);

DROP TRIGGER IF EXISTS resources_updated_at ON public.resources;
CREATE TRIGGER resources_updated_at
  BEFORE UPDATE ON public.resources
  FOR EACH ROW EXECUTE FUNCTION system.update_updated_at();

DROP TRIGGER IF EXISTS resources_prevent_user_change ON public.resources;
CREATE TRIGGER resources_prevent_user_change
  BEFORE UPDATE ON public.resources
  FOR EACH ROW EXECUTE FUNCTION public.prevent_user_id_change();

ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS resources_select_own ON public.resources;
DROP POLICY IF EXISTS resources_insert_own ON public.resources;
DROP POLICY IF EXISTS resources_update_own ON public.resources;
DROP POLICY IF EXISTS resources_delete_own ON public.resources;

CREATE POLICY resources_select_own ON public.resources
  FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
CREATE POLICY resources_insert_own ON public.resources
  FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY resources_update_own ON public.resources
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY resources_delete_own ON public.resources
  FOR DELETE TO authenticated USING (user_id = (SELECT auth.uid()));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.resources TO authenticated;

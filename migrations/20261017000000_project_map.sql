-- Project map: per-project modules and step-by-step flows, written by agents and read on the web.

CREATE TABLE IF NOT EXISTS public.project_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.dev_board_projects(id) ON DELETE CASCADE,
  slug TEXT NOT NULL CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND char_length(slug) <= 60),
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 120),
  description TEXT NOT NULL DEFAULT '' CHECK (char_length(description) <= 2000),
  depends_on TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (project_id, slug)
);

CREATE TABLE IF NOT EXISTS public.project_flows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.dev_board_projects(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES public.project_modules(id) ON DELETE CASCADE,
  slug TEXT NOT NULL CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND char_length(slug) <= 60),
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 200),
  summary TEXT NOT NULL DEFAULT '' CHECK (char_length(summary) <= 2000),
  steps JSONB NOT NULL CHECK (jsonb_typeof(steps) = 'array' AND jsonb_array_length(steps) BETWEEN 1 AND 20),
  commit TEXT NULL CHECK (char_length(commit) <= 40),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (project_id, slug)
);

CREATE INDEX IF NOT EXISTS project_modules_user_id_project_id_idx
  ON public.project_modules (user_id, project_id);
CREATE INDEX IF NOT EXISTS project_flows_user_id_project_id_idx
  ON public.project_flows (user_id, project_id);
CREATE INDEX IF NOT EXISTS project_flows_module_id_idx
  ON public.project_flows (module_id);

DROP TRIGGER IF EXISTS project_modules_updated_at ON public.project_modules;
CREATE TRIGGER project_modules_updated_at
  BEFORE UPDATE ON public.project_modules
  FOR EACH ROW EXECUTE FUNCTION system.update_updated_at();

DROP TRIGGER IF EXISTS project_modules_prevent_user_change ON public.project_modules;
CREATE TRIGGER project_modules_prevent_user_change
  BEFORE UPDATE ON public.project_modules
  FOR EACH ROW EXECUTE FUNCTION public.prevent_user_id_change();

DROP TRIGGER IF EXISTS project_flows_updated_at ON public.project_flows;
CREATE TRIGGER project_flows_updated_at
  BEFORE UPDATE ON public.project_flows
  FOR EACH ROW EXECUTE FUNCTION system.update_updated_at();

DROP TRIGGER IF EXISTS project_flows_prevent_user_change ON public.project_flows;
CREATE TRIGGER project_flows_prevent_user_change
  BEFORE UPDATE ON public.project_flows
  FOR EACH ROW EXECUTE FUNCTION public.prevent_user_id_change();

ALTER TABLE public.project_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_flows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS project_modules_select_own ON public.project_modules;
DROP POLICY IF EXISTS project_modules_insert_own ON public.project_modules;
DROP POLICY IF EXISTS project_modules_update_own ON public.project_modules;
DROP POLICY IF EXISTS project_modules_delete_own ON public.project_modules;

CREATE POLICY project_modules_select_own ON public.project_modules
  FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
CREATE POLICY project_modules_insert_own ON public.project_modules
  FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY project_modules_update_own ON public.project_modules
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY project_modules_delete_own ON public.project_modules
  FOR DELETE TO authenticated USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS project_flows_select_own ON public.project_flows;
DROP POLICY IF EXISTS project_flows_insert_own ON public.project_flows;
DROP POLICY IF EXISTS project_flows_update_own ON public.project_flows;
DROP POLICY IF EXISTS project_flows_delete_own ON public.project_flows;

CREATE POLICY project_flows_select_own ON public.project_flows
  FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
CREATE POLICY project_flows_insert_own ON public.project_flows
  FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY project_flows_update_own ON public.project_flows
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY project_flows_delete_own ON public.project_flows
  FOR DELETE TO authenticated USING (user_id = (SELECT auth.uid()));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_modules TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_flows TO authenticated;

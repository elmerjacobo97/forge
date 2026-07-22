-- Uptime Monitor: periodic HTTP checks on user-owned URLs with Telegram alerts.

CREATE TABLE public.uptime_monitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 80),
  url TEXT NOT NULL CHECK (char_length(url) BETWEEN 1 AND 2048 AND url ~* '^https?://'),
  method TEXT NOT NULL DEFAULT 'GET' CHECK (method IN ('GET', 'HEAD')),
  expected_status INTEGER NOT NULL DEFAULT 200 CHECK (expected_status BETWEEN 100 AND 599),
  interval_minutes INTEGER NOT NULL DEFAULT 5 CHECK (interval_minutes IN (1, 5, 15, 30)),
  failure_threshold INTEGER NOT NULL DEFAULT 2 CHECK (failure_threshold BETWEEN 1 AND 10),
  enabled BOOLEAN NOT NULL DEFAULT true,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'up', 'down')),
  consecutive_failures INTEGER NOT NULL DEFAULT 0 CHECK (consecutive_failures >= 0),
  last_checked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.uptime_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  monitor_id UUID NOT NULL REFERENCES public.uptime_monitors(id) ON DELETE CASCADE,
  ok BOOLEAN NOT NULL,
  status_code INTEGER,
  latency_ms INTEGER NOT NULL CHECK (latency_ms >= 0),
  error TEXT CHECK (error IS NULL OR char_length(error) <= 500),
  checked_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.uptime_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  monitor_id UUID NOT NULL REFERENCES public.uptime_monitors(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ
);

CREATE TABLE public.uptime_notification_settings (
  user_id UUID PRIMARY KEY DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  telegram_bot_token TEXT,
  telegram_chat_id TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX uptime_monitors_user_id_idx ON public.uptime_monitors (user_id);
CREATE INDEX uptime_monitors_enabled_idx ON public.uptime_monitors (enabled);
CREATE INDEX uptime_checks_monitor_checked_idx
  ON public.uptime_checks (monitor_id, checked_at DESC);
CREATE INDEX uptime_incidents_monitor_started_idx
  ON public.uptime_incidents (monitor_id, started_at DESC);

CREATE TRIGGER uptime_monitors_prevent_user_change
  BEFORE UPDATE ON public.uptime_monitors
  FOR EACH ROW EXECUTE FUNCTION public.prevent_user_id_change();

CREATE TRIGGER uptime_notification_settings_updated_at
  BEFORE UPDATE ON public.uptime_notification_settings
  FOR EACH ROW EXECUTE FUNCTION system.update_updated_at();

CREATE OR REPLACE FUNCTION public.owns_uptime_monitor(p_monitor_id UUID)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.uptime_monitors
    WHERE id = p_monitor_id
      AND user_id = (SELECT auth.uid())
  );
$$;

ALTER TABLE public.uptime_monitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uptime_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uptime_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uptime_notification_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY uptime_monitors_select_own ON public.uptime_monitors
  FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
CREATE POLICY uptime_monitors_insert_own ON public.uptime_monitors
  FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY uptime_monitors_update_own ON public.uptime_monitors
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY uptime_monitors_delete_own ON public.uptime_monitors
  FOR DELETE TO authenticated USING (user_id = (SELECT auth.uid()));

CREATE POLICY uptime_checks_select_own ON public.uptime_checks
  FOR SELECT TO authenticated
  USING (public.owns_uptime_monitor(monitor_id));

CREATE POLICY uptime_incidents_select_own ON public.uptime_incidents
  FOR SELECT TO authenticated
  USING (public.owns_uptime_monitor(monitor_id));

CREATE POLICY uptime_notification_settings_select_own ON public.uptime_notification_settings
  FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
CREATE POLICY uptime_notification_settings_insert_own ON public.uptime_notification_settings
  FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY uptime_notification_settings_update_own ON public.uptime_notification_settings
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- No insert/update/delete policies on uptime_checks/uptime_incidents: written only by the cron run (admin client).

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.uptime_monitors TO authenticated;
GRANT SELECT ON public.uptime_checks TO authenticated;
GRANT SELECT ON public.uptime_incidents TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.uptime_notification_settings TO authenticated;

REVOKE ALL ON FUNCTION public.owns_uptime_monitor(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.owns_uptime_monitor(UUID) TO authenticated;

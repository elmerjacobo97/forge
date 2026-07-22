-- Webhook Inspector: temporary public capture URLs for authenticated users.

CREATE TABLE public.webhook_endpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE CHECK (char_length(token) BETWEEN 32 AND 128),
  name TEXT NOT NULL DEFAULT '' CHECK (char_length(name) <= 80),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint_id UUID NOT NULL REFERENCES public.webhook_endpoints(id) ON DELETE CASCADE,
  method TEXT NOT NULL CHECK (char_length(method) BETWEEN 1 AND 16),
  path TEXT NOT NULL CHECK (char_length(path) BETWEEN 1 AND 4096),
  headers JSONB NOT NULL DEFAULT '{}'::jsonb,
  body TEXT NOT NULL DEFAULT '' CHECK (char_length(body) <= 64000),
  body_truncated BOOLEAN NOT NULL DEFAULT false,
  source_ip TEXT CHECK (source_ip IS NULL OR char_length(source_ip) <= 128),
  user_agent TEXT CHECK (user_agent IS NULL OR char_length(user_agent) <= 1024),
  received_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Rate-limit windows written only by the public receiver (admin client).
CREATE TABLE public.webhook_rate_limits (
  token TEXT NOT NULL CHECK (char_length(token) BETWEEN 32 AND 128),
  window_start TIMESTAMPTZ NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 0 CHECK (request_count >= 0),
  PRIMARY KEY (token, window_start)
);

CREATE INDEX webhook_endpoints_user_id_idx ON public.webhook_endpoints (user_id);
CREATE INDEX webhook_endpoints_token_idx ON public.webhook_endpoints (token);
CREATE INDEX webhook_endpoints_expires_at_idx ON public.webhook_endpoints (expires_at);
CREATE INDEX webhook_events_endpoint_received_idx
  ON public.webhook_events (endpoint_id, received_at DESC);

CREATE OR REPLACE FUNCTION public.owns_webhook_endpoint(p_endpoint_id UUID)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.webhook_endpoints
    WHERE id = p_endpoint_id
      AND user_id = (SELECT auth.uid())
  );
$$;

ALTER TABLE public.webhook_endpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY webhook_endpoints_select_own ON public.webhook_endpoints
  FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
CREATE POLICY webhook_endpoints_insert_own ON public.webhook_endpoints
  FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY webhook_endpoints_delete_own ON public.webhook_endpoints
  FOR DELETE TO authenticated USING (user_id = (SELECT auth.uid()));

CREATE POLICY webhook_events_select_own ON public.webhook_events
  FOR SELECT TO authenticated
  USING (public.owns_webhook_endpoint(endpoint_id));
CREATE POLICY webhook_events_insert_own ON public.webhook_events
  FOR INSERT TO authenticated
  WITH CHECK (public.owns_webhook_endpoint(endpoint_id));
CREATE POLICY webhook_events_delete_own ON public.webhook_events
  FOR DELETE TO authenticated
  USING (public.owns_webhook_endpoint(endpoint_id));

-- No anon/authenticated policies on webhook_rate_limits: admin client only.

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.webhook_endpoints TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.webhook_events TO authenticated;

REVOKE ALL ON public.webhook_rate_limits FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.owns_webhook_endpoint(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.owns_webhook_endpoint(UUID) TO authenticated;

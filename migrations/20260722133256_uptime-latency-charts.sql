-- Uptime Monitor charts: latency buckets, daily uptime, and list sparklines.
-- SECURITY INVOKER so existing RLS on uptime_checks / uptime_monitors applies.

CREATE OR REPLACE FUNCTION public.uptime_latency_buckets(
  p_monitor_id UUID,
  p_range TEXT
)
RETURNS TABLE (
  bucket_start TIMESTAMPTZ,
  avg_latency_ms NUMERIC,
  ok_count INTEGER,
  total_count INTEGER
)
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  v_bucket INTERVAL;
  v_lookback INTERVAL;
  v_origin TIMESTAMPTZ := TIMESTAMPTZ '1970-01-01 00:00:00+00';
BEGIN
  IF p_range = '24h' THEN
    v_bucket := INTERVAL '30 minutes';
    v_lookback := INTERVAL '24 hours';
  ELSIF p_range = '7d' THEN
    v_bucket := INTERVAL '3 hours';
    v_lookback := INTERVAL '7 days';
  ELSIF p_range = '30d' THEN
    v_bucket := INTERVAL '1 day';
    v_lookback := INTERVAL '30 days';
  ELSE
    RAISE EXCEPTION 'Invalid range: %. Expected 24h, 7d, or 30d', p_range;
  END IF;

  RETURN QUERY
  SELECT
    date_bin(v_bucket, c.checked_at, v_origin) AS bucket_start,
    AVG(c.latency_ms)::NUMERIC AS avg_latency_ms,
    COUNT(*) FILTER (WHERE c.ok)::INTEGER AS ok_count,
    COUNT(*)::INTEGER AS total_count
  FROM public.uptime_checks c
  WHERE c.monitor_id = p_monitor_id
    AND c.checked_at >= (now() - v_lookback)
  GROUP BY 1
  ORDER BY 1;
END;
$$;

CREATE OR REPLACE FUNCTION public.uptime_daily_uptime(
  p_monitor_id UUID
)
RETURNS TABLE (
  day DATE,
  ok_count INTEGER,
  total_count INTEGER
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = pg_catalog, public, pg_temp
AS $$
  SELECT
    (c.checked_at AT TIME ZONE 'UTC')::DATE AS day,
    COUNT(*) FILTER (WHERE c.ok)::INTEGER AS ok_count,
    COUNT(*)::INTEGER AS total_count
  FROM public.uptime_checks c
  WHERE c.monitor_id = p_monitor_id
    AND c.checked_at >= (
      ((now() AT TIME ZONE 'UTC')::DATE - 29)
      AT TIME ZONE 'UTC'
    )
  GROUP BY 1
  ORDER BY 1;
$$;

CREATE OR REPLACE FUNCTION public.uptime_sparklines(
  p_monitor_ids UUID[]
)
RETURNS TABLE (
  monitor_id UUID,
  bucket_start TIMESTAMPTZ,
  avg_latency_ms NUMERIC,
  ok_count INTEGER,
  total_count INTEGER
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = pg_catalog, public, pg_temp
AS $$
  SELECT
    c.monitor_id,
    date_bin(
      INTERVAL '30 minutes',
      c.checked_at,
      TIMESTAMPTZ '1970-01-01 00:00:00+00'
    ) AS bucket_start,
    AVG(c.latency_ms)::NUMERIC AS avg_latency_ms,
    COUNT(*) FILTER (WHERE c.ok)::INTEGER AS ok_count,
    COUNT(*)::INTEGER AS total_count
  FROM public.uptime_checks c
  WHERE c.monitor_id = ANY (p_monitor_ids)
    AND c.checked_at >= (now() - INTERVAL '24 hours')
  GROUP BY 1, 2
  ORDER BY 1, 2;
$$;

REVOKE ALL ON FUNCTION public.uptime_latency_buckets(UUID, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.uptime_daily_uptime(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.uptime_sparklines(UUID[]) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.uptime_latency_buckets(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.uptime_daily_uptime(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.uptime_sparklines(UUID[]) TO authenticated;

-- Add per-monitor HTTP request headers for scheduled uptime checks.

ALTER TABLE public.uptime_monitors
  ADD COLUMN request_headers JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD CONSTRAINT uptime_monitors_request_headers_array_check
    CHECK (jsonb_typeof(request_headers) = 'array'),
  ADD CONSTRAINT uptime_monitors_request_headers_limit_check
    CHECK (
      CASE
        WHEN jsonb_typeof(request_headers) = 'array'
          THEN jsonb_array_length(request_headers) <= 20
        ELSE false
      END
    );

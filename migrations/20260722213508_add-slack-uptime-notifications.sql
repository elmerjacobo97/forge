-- Add per-user Slack notification settings without changing Telegram behavior.

ALTER TABLE public.uptime_notification_settings
  ADD COLUMN slack_webhook_url TEXT,
  ADD COLUMN slack_enabled BOOLEAN NOT NULL DEFAULT false;

# Uptime Monitor

HTTP monitors with scheduled checks, latency/uptime charts, and down/recovery
alerts via Telegram and Slack. Specs: `09-uptime-monitor.md`,
`10-latency-uptime-charts.md`, `11-uptime-slack-notifications.md`.

## Cron setup

The check run (`app/api/uptime/run`) is triggered by an InsForge schedule, not
by Vercel Cron or an external service (see SPEC 09, Decisiones). Run this once
per environment after deploying the app.

### 1. Store the cron secret

Generate a random token and store it as both a server env var and an InsForge
secret (the schedule can only read it via `${{secrets.CRON_TOKEN}}`):

```bash
# .env / hosting provider env vars (server-only, never NEXT_PUBLIC_*)
CRON_TOKEN="$(openssl rand -hex 32)"

npx @insforge/cli secrets add CRON_TOKEN "$CRON_TOKEN"
```

### 2. Create the schedule

Replace `APP_URL` with the deployed app's public origin
(`NEXT_PUBLIC_APP_URL`).

```bash
npx @insforge/cli schedules create \
  --name "Uptime Monitor checks" \
  --cron "* * * * *" \
  --url "https://APP_URL/api/uptime/run" \
  --method POST \
  --headers '{"Authorization": "Bearer ${{secrets.CRON_TOKEN}}"}'
```

`* * * * *` fires every minute; `run-checks.ts` filters to the monitors whose
own `interval_minutes` is actually due, so a 1-minute monitor is checked every
tick and a 30-minute monitor only on its own cadence.

### 3. Verify

```bash
npx @insforge/cli schedules list
npx @insforge/cli schedules logs <id>
```

A healthy run returns `200 { "checked": n }`. `401` means `CRON_TOKEN` is
missing or doesn't match between the env var and the InsForge secret.

## Notifications

Alerts fire only on status transitions (`up` → `down`, `down` → `up`), not on
every failed check or the first result. Delivery is per user and global across
monitors. Channels are independent: a Slack failure is logged and does not
block Telegram or the cron.

Configure each channel from the Uptime Monitor page (separate dialogs).

### Telegram

1. Create a bot with [@BotFather](https://core.telegram.org/bots#botfather).
2. Open **Telegram notifications**, paste the bot token and chat ID, save.
3. Send a test message from the dialog to confirm delivery.

### Slack

1. Create an [Incoming Webhook](https://api.slack.com/messaging/webhooks) for
   the target channel.
2. Open **Slack notifications**, paste the HTTPS URL
   (`hooks.slack.com` only), enable the toggle, and save.
3. Send a test message from the dialog (uses the saved webhook only).

The webhook is never shown again after save. You can replace it with a new URL
or clear it (clearing also disables Slack). Enabling Slack requires a saved
webhook or a valid URL in the same save.

### Implementation notes

| Piece | Role |
| --- | --- |
| `server/telegram.ts` | Telegram Bot API client + message formatting |
| `server/slack.ts` | Incoming Webhook client + Block Kit payloads |
| `server/notifications.ts` | Multi-channel dispatcher for `UptimeAlertEvent` |
| `server/run-checks.ts` | Builds one event per transition and dispatches |
| `uptime_notification_settings` | Per-user Telegram + Slack credentials (RLS) |

Secrets stay server-side: client queries expose Telegram fields needed to edit,
but only `slackConfigured` / `slackEnabled` for Slack — never `slack_webhook_url`.

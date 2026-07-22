# Uptime Monitor — cron setup

The check run (`app/api/uptime/run`) is triggered by an InsForge schedule, not
by Vercel Cron or an external service (see spec `09-uptime-monitor.md`,
Decisiones). Run this once per environment after deploying the app.

## 1. Store the cron secret

Generate a random token and store it as both a server env var and an InsForge
secret (the schedule can only read it via `${{secrets.CRON_TOKEN}}`):

```bash
# .env / hosting provider env vars (server-only, never NEXT_PUBLIC_*)
CRON_TOKEN="$(openssl rand -hex 32)"

npx @insforge/cli secrets add CRON_TOKEN "$CRON_TOKEN"
```

## 2. Create the schedule

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

## 3. Verify

```bash
npx @insforge/cli schedules list
npx @insforge/cli schedules logs <id>
```

A healthy run returns `200 { "checked": n }`. `401` means `CRON_TOKEN` is
missing or doesn't match between the env var and the InsForge secret.

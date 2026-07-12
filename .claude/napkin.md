# Napkin Runbook

## Curation Rules
- Re-prioritize on every read.
- Keep recurring, high-value notes only.
- Max 10 items per category.
- Each item includes date + "Do instead".

## Execution & Validation (Highest Priority)
1. **[2026-07-12] Browser-only web app with Vitest tests**
   Do instead: run focused Vitest commands through `pnpm --filter @forge/web test` before reporting test work.

## User Directives
1. **[2026-07-12] Test-only cloud-service coverage**
   Do instead: modify tests only unless production changes are unavoidable; cover configuration, missing-user, Appwrite calls, and no browser-storage fallback.

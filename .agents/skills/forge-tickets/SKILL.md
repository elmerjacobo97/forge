---
name: forge-tickets
description: Manage Forge Dev Board tickets via the forge-cli binary (create, list, get, update, delete, move). Use when the user asks to create a ticket, move a card on the board, list tickets by project/column, update priority/title, or run forge-cli ticket commands against InsForge.
---

# Forge Dev Board tickets (`forge-cli`)

Use the monorepo CLI binary **`forge-cli`** (not Laravel Forge’s `forge`). Prefer the global bin after `pnpm link --global` from `apps/cli`, or:

```bash
pnpm --filter ./apps/cli forge-cli -- <command>
```

Tickets sync to the same InsForge tables and transactional RPCs as the web app. Auth is per-user; there is no offline mode. Every ticket belongs to a **project** (`--project-id`).

## Prerequisites

One-time config (same InsForge project as `apps/web`):

```bash
# preferred in this monorepo (reads apps/web/.env.local)
forge-cli init --from-web-env
# or interactive: forge-cli init
```

Then sign in:

```bash
forge-cli login --email "<email>"
# or interactive: forge-cli login
forge-cli whoami
```

Session and config live in `~/.forge/` (`config.json`, `session.json`) with mode `0600`.

If you do not have a project id yet, create one first (skill `forge-projects`):

```bash
forge-cli project create --name "My board" --json
# → use the returned id as --project-id
```

## Create a ticket

When the user says something like “add a ticket” / “create a card on the board”:

1. Infer or ask for: `project-id` (required) and `title` (required). Optional: `description`, `priority`, `column`.
2. Run `forge-cli ticket create` with the flags below.
3. Confirm success by printing the returned `id` (or use `--json` and read the object).

```bash
forge-cli ticket create --project-id <projectId> --title "Ship CLI tickets"

forge-cli ticket create \
  --project-id <projectId> \
  --title "WIP: auth fix" \
  --description "Reproduce and fix login edge case" \
  --priority high \
  --column in_progress
```

### Fields

| Flag | Rules |
|------|--------|
| `--project-id` | required; must exist and belong to the signed-in user |
| `--title` | required, 1–120 characters |
| `--description` | optional, default `""`, max 2000 |
| `--priority` | `low` \| `med` \| `high` (default `med`) |
| `--column` | `backlog` \| `todo` \| `in_progress` \| `review` \| `done` (default `backlog`) |

Creating with `--column in_progress` starts the timer (same semantics as the web board).
Create without `--project-id`, or with an id that is missing / not yours, exits non-zero and does not create a ticket.

Invalid input exits non-zero with a clear error — fix flags and retry. Do not invent an API key; login uses email/password only.

## Move a ticket

Change column with `move` (not `update`). Move appends to the end of the destination column and applies timer/events like the web:

```bash
forge-cli ticket move <id> --column in_progress
forge-cli ticket move <id> --column done --json
```

Entering `in_progress` starts the timer; leaving it with an active timer writes a time entry.

## Other commands

```bash
# List (requires --project-id; text by default)
forge-cli ticket list --project-id <projectId>
forge-cli ticket list --project-id <projectId> --column todo

# Machine-readable (agents / scripts)
forge-cli ticket list --project-id <projectId> --json
forge-cli ticket get <id> --json
forge-cli ticket create --project-id <projectId> ... --json
forge-cli ticket update <id> --title "New title" --json
forge-cli ticket move <id> --column review --json

# Update fields only (not column, not project)
forge-cli ticket update <id> --description "Updated notes" --priority low

forge-cli ticket delete <id>

forge-cli logout
```

`--json` applies to `create`, `list`, `get`, `update`, and `move`. Without it, output is human-readable text (includes `projectId` and a short timer summary).

`get` / `update` / `move` / `delete` still take a ticket id (no `--project-id` required on those).

## Agent checklist

- Use **`forge-cli`**, never bare `forge` (conflicts with Laravel Forge CLI).
- Ensure `init` + `login` before ticket mutations. Re-run `init --from-web-env` if Dev Board table IDs are missing from config.
- Always pass `--project-id` on `ticket create` and `ticket list`.
- Prefer `--json` when parsing results in automation.
- Change column only via `ticket move`, never `ticket update`.
- Columns only: `backlog`, `todo`, `in_progress`, `review`, `done`.
- Priorities only: `low`, `med`, `high`.
- Do not pause/resume timers, read analytics, reorder with `--position`, move tickets between projects, or cascade-delete events — out of scope for this CLI surface.
- Projects stay under `forge-cli project` / skill `forge-projects`. Bookmarks stay under `forge-cli bookmark` / skill `forge-bookmarks`.

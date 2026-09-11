---
name: forge-tickets
description: Manage Forge Dev Board tickets via the forge-cli binary (create, list, get, update, delete, move, next, comment). Use when the user asks to create a ticket, move a card on the board, pick the next pending ticket, leave handoff comments, list tickets by project/column, update priority/title, or run forge-cli ticket commands against InsForge.
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

`move` also accepts the handoff flags (`--branch`, `--pr-url`, `--clear-branch`, `--clear-pr-url`) and writes them atomically with the column change.

## Agent ticket loop

Use this loop when working a ticket end to end as an agent:

1. **Pick work**: `forge-cli ticket next --json` returns the best pending `todo` ticket, ranked by priority (`high → med → low`) with ties broken by board position. It also returns the ticket's project, its comments, and any tickets already `in_progress` (a warning, not a blocker). Add `--project-id <id>` to scope both the candidates and the in-progress list to one project.

   ```bash
   forge-cli ticket next
   forge-cli ticket next --project-id <projectId> --json
   ```

   `next` is read-only: it never moves tickets or writes comments. When there is no `todo` work, the text says `No pending tickets.` and `--json` returns `{ "ticket": null, ... }` (exit code 0).

2. **Start**: `forge-cli ticket move <id> --column in_progress` (starts the timer).
3. **Work** the ticket.
4. **Hand off**: comment first, then move to `review` with branch and PR in the same call.

   ```bash
   forge-cli ticket comment <id> --body "Implemented X; tests green" --author agent
   forge-cli ticket move <id> --column review \
     --branch dev/handoff \
     --pr-url "https://github.com/acme/forge/pull/17"
   ```

## Comments

Comments are append-only plain text (1–5000 characters), ordered oldest first. There is no edit, delete, markdown, or pagination; do not attempt those.

```bash
forge-cli ticket comment <id> --body "Handoff notes"        # author defaults to user
forge-cli ticket comment <id> --body "Done" --author agent
forge-cli ticket comments <id>
forge-cli ticket comments <id> --json
```

`comment` on a missing or foreign ticket exits non-zero with `Ticket not found.` and creates nothing.

## Handoff fields

`ticket update` and `ticket move` accept:

| Flag | Effect |
|------|--------|
| `--branch <name>` | bind a git branch (1–200 characters) |
| `--pr-url <url>` | bind a PR URL (`http`/`https`, max 2048) |
| `--clear-branch` | clear the branch |
| `--clear-pr-url` | clear the PR URL |

`move` writes the handoff atomically with the column change. `update` without these flags keeps the current values; `--branch ""` is neither needed nor accepted.

## Other commands

```bash
# List (requires --project-id; text by default)
forge-cli ticket list --project-id <projectId>
forge-cli ticket list --project-id <projectId> --column todo

# Machine-readable (agents / scripts)
forge-cli ticket next --json
forge-cli ticket list --project-id <projectId> --json
forge-cli ticket get <id> --json
forge-cli ticket create --project-id <projectId> ... --json
forge-cli ticket update <id> --title "New title" --json
forge-cli ticket move <id> --column review --json
forge-cli ticket comment <id> --body "Notes" --author agent --json
forge-cli ticket comments <id> --json
forge-cli ticket delete <id> --json

# Update fields only (not column, not project)
forge-cli ticket update <id> --description "Updated notes" --priority low

forge-cli logout
```

`--json` applies to every ticket command, including `delete`. Without it, output is human-readable text (includes `projectId`, branch/PR, and a short timer summary).

With `--json`, any error prints `{"error":{"message":"..."}}` to stderr and exits 1 while stdout stays clean. `ticket delete --json` returns `{"deleted":true,"id":"..."}`. Without `--json`, existing text output is unchanged.

`get` / `update` / `move` / `delete` / `comment` / `comments` still take a ticket id (no `--project-id` required on those). `next` takes an optional `--project-id`.

## Agent checklist

- Use **`forge-cli`**, never bare `forge` (conflicts with Laravel Forge CLI).
- Ensure `init` + `login` before ticket mutations. Re-run `init --from-web-env` if Dev Board table IDs are missing from config.
- Start agent work from `ticket next`; it is read-only.
- Always pass `--project-id` on `ticket create` and `ticket list`.
- Prefer `--json` when parsing results in automation.
- Change column only via `ticket move`, never `ticket update`.
- Comment handoff as `--author agent`; comments are append-only (no edit/delete).
- Move to `review` with `--branch` and `--pr-url` in the same call whenever you have them.
- Columns only: `backlog`, `todo`, `in_progress`, `review`, `done`.
- Priorities only: `low`, `med`, `high`.
- Do not pause/resume timers, read analytics, reorder with `--position`, move tickets between projects, or cascade-delete events — out of scope for this CLI surface.
- Projects stay under `forge-cli project` / skill `forge-projects`. Bookmarks stay under `forge-cli bookmark` / skill `forge-bookmarks`.

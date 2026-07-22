---
name: forge-projects
description: Manage Forge Dev Board projects via the forge-cli binary (create, list, get, update, delete). Use when the user asks to create a project/board, list Dev Board projects, rename a project, delete an empty project, or run forge-cli project commands against InsForge.
---

# Forge Dev Board projects (`forge-cli`)

Use the monorepo CLI binary **`forge-cli`** (not Laravel Forge’s `forge`). Prefer the global bin after `pnpm link --global` from `apps/cli`, or:

```bash
pnpm --filter ./apps/cli forge-cli -- <command>
```

Projects sync to the same InsForge table and RLS policies as the web app. Auth is per-user; there is no offline mode.

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

## Create a project

When the user says something like “create a project” / “new board”:

1. Infer or ask for: `name` (required). Optional: `description`.
2. Run `forge-cli project create` with the flags below.
3. Confirm success by printing the returned `id` (or use `--json` and read the object).
4. Use that `id` as `--project-id` when creating tickets (skill `forge-tickets`).

```bash
forge-cli project create --name "Forge"

forge-cli project create \
  --name "Forge" \
  --description "Dev tools board"
```

### Fields

| Flag | Rules |
|------|--------|
| `--name` | required, 1–80 characters |
| `--description` | optional, default `""`, max 2000 |

Invalid input exits non-zero with a clear error — fix flags and retry. Do not invent an API key; login uses email/password only.

## Other commands

```bash
# List (text by default)
forge-cli project list

# Machine-readable (agents / scripts)
forge-cli project list --json
forge-cli project get <id> --json
forge-cli project create ... --json
forge-cli project update <id> --name "New name" --json

forge-cli project update <id> --description "Updated notes"
forge-cli project delete <id>

forge-cli logout
```

`--json` applies to `create`, `list`, `get`, and `update`. Without it, output is human-readable text (short description).

### Delete rules

- Delete succeeds only if the project has **no** tickets.
- If tickets exist, the CLI exits non-zero with a clear message and does not cascade-delete.

## Typical flow (project → ticket)

```bash
forge-cli project create --name "Sprint" --json
# → read id from JSON

forge-cli ticket create --project-id <projectId> --title "Ship feature" --json
```

## Agent checklist

- Use **`forge-cli`**, never bare `forge` (conflicts with Laravel Forge CLI).
- Ensure `init` + `login` before project mutations. Re-run `init --from-web-env` if `devBoardProjectsTableId` is missing.
- Prefer `--json` when parsing results in automation.
- After creating a project, pass its `id` as `--project-id` to `ticket create` / `ticket list`.
- Do not cascade-delete tickets, move tickets between projects, set color/archive, or invent a default/Inbox project — out of scope.
- Tickets stay under `forge-cli ticket` / skill `forge-tickets`.

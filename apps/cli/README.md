# `@forge/cli` (`forge-cli`)

Node CLI for Forge bookmarks, Dev Board projects, and tickets against the same Appwrite project as `apps/web`.

Binary name is **`forge-cli`** (not `forge`) to avoid clashing with Laravel Forge CLI / Herd.

## Setup

```bash
# from repo root
pnpm install
pnpm --filter @forge/cli build

# optional: put forge-cli on your PATH
cd apps/cli && pnpm link --global
```

Or run without a global link:

```bash
pnpm --filter @forge/cli forge-cli -- --help
```

## Configure and sign in

Easiest (from the monorepo, with `apps/web/.env` already filled):

```bash
# from repo root (or apps/cli)
forge-cli init --from-web-env
# or interactive with defaults from apps/web/.env:
forge-cli init

forge-cli login --email you@example.com
forge-cli whoami
```

`init` reads the same IDs as the web app (`VITE_APPWRITE_ENDPOINT`, `PROJECT_ID`, `DATABASE_ID`, `BOOKMARKS_COLLECTION_ID`, and `VITE_APPWRITE_DEV_BOARD_*_TABLE_ID` including projects). Config/session go under `~/.forge/` (`0600` files). Config must include `devBoardProjectsTableId`.

## Bookmarks

```bash
forge-cli bookmark create \
  --title "React docs" \
  --url "https://react.dev" \
  --category docs \
  --description "Official React documentation" \
  --tags react,docs

forge-cli bookmark list
forge-cli bookmark list --json
forge-cli bookmark get <id> --json
forge-cli bookmark update <id> --title "New title"
forge-cli bookmark delete <id>
```

Categories: `docs` | `git` | `tool` | `article` | `other`.

## Dev Board projects

```bash
forge-cli project create --name "Forge"
forge-cli project create --name "Forge" --description "Dev tools"

forge-cli project list
forge-cli project list --json
forge-cli project get <id>
forge-cli project update <id> --name "New name"
forge-cli project delete <id>
```

`--name` is required on create (1–80). `--description` defaults to `""` (max 2000). Delete fails if the project still has tickets (no cascade). `--json` applies to `create|list|get|update`.

## Dev Board tickets

```bash
forge-cli ticket create --project-id <projectId> --title "Ship CLI tickets"
forge-cli ticket create --project-id <projectId> --title "WIP" --column in_progress --priority high

forge-cli ticket list --project-id <projectId>
forge-cli ticket list --project-id <projectId> --column todo --json
forge-cli ticket get <id>
forge-cli ticket update <id> --title "New title" --priority med
forge-cli ticket move <id> --column in_progress
forge-cli ticket move <id> --column done --json
forge-cli ticket delete <id>
```

`--project-id` is required on `create` and `list` (must be a project owned by you).  
Columns: `backlog` | `todo` | `in_progress` | `review` | `done`.  
Priorities: `low` | `med` | `high`.  
Change column only via `move` (starts/stops timer and writes events/time entries like the web). `--json` applies to `create|list|get|update|move`.

## Tests

```bash
pnpm --filter @forge/cli test
```

Unit tests cover validation/parsing/formatting only (no live Appwrite).

## Agent skills

- Bookmarks: `.claude/skills/forge-bookmarks/` and `.agents/skills/forge-bookmarks/`
- Projects: `.claude/skills/forge-projects/` and `.agents/skills/forge-projects/`
- Tickets: `.claude/skills/forge-tickets/` and `.agents/skills/forge-tickets/`

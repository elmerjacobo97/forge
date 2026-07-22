---
name: forge-bookmarks
description: Manage Forge bookmarks via the forge-cli binary (create, list, get, update, delete). Use when the user asks to save a URL, add a bookmark, list bookmarks, update or delete a bookmark, or run forge-cli bookmark commands against InsForge.
---

# Forge bookmarks (`forge-cli`)

Use the monorepo CLI binary **`forge-cli`** (not Laravel Forge’s `forge`). Prefer the global bin after `pnpm link --global` from `apps/cli`, or:

```bash
pnpm --filter ./apps/cli forge-cli -- <command>
```

Bookmarks sync to the same InsForge table and RLS policies as the web app. Auth is per-user; there is no offline mode.

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

Session and config live in `~/.forge/` (`config.json`, `session.json`).

## Add this URL to bookmarks

When the user says something like “bookmark this URL” / “save this link”:

1. Infer or ask for: `title`, `url`, `category`, `description`, optional `tags`.
2. Run `forge-cli bookmark create` with the flags below.
3. Confirm success by printing the returned `id` (or use `--json` and read the object).

```bash
forge-cli bookmark create \
  --title "React docs" \
  --url "https://react.dev" \
  --category docs \
  --description "Official React documentation" \
  --tags react,docs
```

### Required fields (same rules as the web form)

| Flag | Rules |
|------|--------|
| `--title` | min 2 characters |
| `--url` | valid URL |
| `--category` | `docs` \| `git` \| `tool` \| `article` \| `other` |
| `--description` | 5–200 characters |
| `--tags` | optional, comma-separated (e.g. `react,hooks`) |

Invalid input exits non-zero with a clear error — fix flags and retry. Do not invent an API key; login uses email/password only.

## Other commands

```bash
# List (text by default)
forge-cli bookmark list

# Machine-readable (agents / scripts)
forge-cli bookmark list --json
forge-cli bookmark get <id> --json
forge-cli bookmark create ... --json
forge-cli bookmark update <id> --title "New title" --json

forge-cli bookmark update <id> --description "Updated blurb" --tags a,b
forge-cli bookmark delete <id>

forge-cli logout
```

`--json` applies to `create`, `list`, `get`, and `update`. Without it, output is human-readable text.

## Agent checklist

- Use **`forge-cli`**, never bare `forge` (conflicts with Laravel Forge CLI).
- Ensure `init` + `login` before bookmark mutations.
- Prefer `--json` when parsing results in automation.
- Categories only: `docs`, `git`, `tool`, `article`, `other`.
- Do not add tickets, resources, MCP, or AI generation here — bookmarks CRUD only.

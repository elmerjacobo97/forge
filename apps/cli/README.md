# `@forge/cli` (`forge-cli`)

Node CLI for Forge bookmarks against the same Appwrite project as `apps/web`.

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

Use the same Appwrite IDs as `apps/web/.env` (`VITE_APPWRITE_*`):

```bash
forge-cli init \
  --endpoint "$VITE_APPWRITE_ENDPOINT" \
  --project-id "$VITE_APPWRITE_PROJECT_ID" \
  --database-id "$VITE_APPWRITE_DATABASE_ID" \
  --bookmarks-table-id "$VITE_APPWRITE_BOOKMARKS_COLLECTION_ID"

forge-cli login --email you@example.com
forge-cli whoami
```

Config/session are stored under `~/.forge/` (`0600` files).

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

## Tests

```bash
pnpm --filter @forge/cli test
```

Unit tests cover validation/parsing only (no live Appwrite).

## Agent skill

See `.claude/skills/forge-bookmarks/` and `.agents/skills/forge-bookmarks/`.

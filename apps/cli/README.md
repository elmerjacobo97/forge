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

Easiest (from the monorepo, with `apps/web/.env` already filled):

```bash
# from repo root (or apps/cli)
forge-cli init --from-web-env
# or interactive with defaults from apps/web/.env:
forge-cli init

forge-cli login --email you@example.com
forge-cli whoami
```

`init` reads the same IDs as the web app (`VITE_APPWRITE_ENDPOINT`, `PROJECT_ID`, `DATABASE_ID`, `BOOKMARKS_COLLECTION_ID`). Config/session go under `~/.forge/` (`0600` files).

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

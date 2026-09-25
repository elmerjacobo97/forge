---
name: forge-ideas
description: "Use when managing Forge ideas with forge-cli: capture or save an idea, list ideas, update an idea's status, or delete an idea."
license: MIT
metadata:
  author: elmerjacobo97
  version: "1.0.0"
---

# Forge ideas (`forge-cli`)

Use the global binary **`forge-cli`** (not Laravel Forge's `forge`):

```bash
npm install -g @codigoconelmer/forge-cli
forge-cli --version   # requires >= 0.7.0 (idea command)
```

Ideas sync to the InsForge `ideas` table and RLS policies used by the web `/ideas` tool. Auth is per-user; there is no offline mode.

## Prerequisites

One-time config:

```bash
# inside the forge monorepo only (reads apps/web/.env.local):
forge-cli init --from-web-env
# from anywhere else, use the interactive prompt or pass flags:
forge-cli init
forge-cli init --url <url> --anon-key <key>
```

Then sign in:

```bash
forge-cli login --email "<email>"
forge-cli whoami
```

Session and config live in `~/.forge/` (`config.json`, `session.json`).

## Create an idea

```bash
forge-cli idea create \
  --title "Coffee meetup app" \
  --content "Join strangers for coffee at local cafés" \
  --category mobile \
  --status exploring \
  --tags social,local \
  --links https://example.com/inspiration
```

### Fields (same rules as the web form)

| Flag         | Rules                                                                                   |
| ------------ | --------------------------------------------------------------------------------------- |
| `--title`    | required, min 2 characters                                                              |
| `--content`  | required                                                                                |
| `--status`   | optional, default `seed` (`seed` \| `exploring` \| `building` \| `parked` \| `shipped`) |
| `--category` | optional, default `other` (`app` \| `web` \| `mobile` \| `business` \| `other`)         |
| `--tags`     | optional, comma-separated (trimmed, lowercased, deduped)                                |
| `--links`    | optional, comma-separated URLs, max 10 (trimmed, deduped)                               |

On update, `--tags ""` or `--links ""` clears that array. An invalid `--status` or `--category` exits 1 with the list of valid values.

## Other commands

```bash
forge-cli idea list
forge-cli idea list --json
forge-cli idea list --limit 10 --offset 10
forge-cli idea get <id> --json
forge-cli idea create ... --json
forge-cli idea update <id> --status building --json
forge-cli idea update <id> --links "" --json
forge-cli idea delete <id>
```

`--json` applies to `create`, `list`, `get`, `update`, and `delete`. Errors print `{"error":{"message":"..."}}` to stderr with exit 1.

## Agent checklist

- Use **`forge-cli`**, never bare `forge`.
- Ensure `init` + `login` before idea mutations.
- Prefer `--json` when parsing results in automation.
- Statuses: `seed`, `exploring`, `building`, `parked`, `shipped`.
- Categories: `app`, `web`, `mobile`, `business`, `other`.
- Ideas CRUD only — no MCP, no AI generation, no bookmarks/resources/tickets here.

---
name: forge-resources
description: "Use when managing Forge resources with forge-cli: save a link resource (URL, category, description, tags), list resources, get, update, or delete a resource."
license: MIT
metadata:
  author: elmerjacobo97
  version: "1.2.0"
---

# Forge resources (`forge-cli`)

Use the global binary **`forge-cli`** (not Laravel Forge’s `forge`):

```bash
npm install -g @codigoconelmer/forge-cli
forge-cli --version
```

Resources sync to the InsForge `resources` table and RLS policies used by the web `/resources` tool. Auth is per-user; there is no offline mode.

## Transport: CLI or MCP

With the Forge MCP connector, use the `forge_*` tools (no `init`/`login`). Without it, use `forge-cli`.

MCP `create`/`get`/`update` results include `forgeUrl` (Forge web link). CLI output includes a `forge:` line. Always show that link to the user.

| Action | CLI | MCP |
| --- | --- | --- |
| List | `resource list` | `forge_list_resources` |
| Read | `resource get <id>` | `forge_get_resource` |
| Create | `resource create` | `forge_create_resource` |
| Edit | `resource update <id>` | `forge_update_resource` (`tags` replaces; `addTags` / `removeTags` adjust) |
| Delete | `resource delete <id>` | `forge_delete_resource` |

`--limit` / `--offset` exist only in CLI.

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

## Create a resource

```bash
forge-cli resource create \
  --title "AI Design Skills" \
  --url https://github.com/elayadesign/ai-design-skills \
  --category git \
  --description "Colección de skills de diseño para Claude Code, Cursor y Codex." \
  --tags design,skills,ai
```

### Fields

| Flag            | Rules                                                     |
| --------------- | --------------------------------------------------------- |
| `--title`       | required, min 2 characters                                |
| `--url`         | required, valid URL                                       |
| `--category`    | required: `docs` \| `git` \| `tool` \| `article` \| `other` |
| `--description` | required, 5–200 characters                                |
| `--tags`        | optional, comma-separated                                 |

## Other commands

```bash
forge-cli resource list
forge-cli resource list --limit 10 --offset 10
forge-cli resource list --json
forge-cli resource get <id> --json
forge-cli resource update <id> --title "New title" --json
forge-cli resource delete <id>
```

- `--limit` 1–1000; `--offset` requires `--limit`.
- `update` takes at least one of `--title`, `--url`, `--category`, `--description`, `--tags`.
- `--json` applies to `create`, `list`, `get`, and `update`.

## Agent checklist

- Use **`forge-cli`**, never bare `forge`.
- Ensure `init` + `login` before resource mutations; check with `forge-cli whoami`.
- Prefer `--json` when parsing results in automation.
- Categories: `docs`, `git`, `tool`, `article`, `other`.
- `bookmark` is an alias for `resource`.
- Show the Forge link (`forgeUrl` from MCP, `forge:` line from CLI) after create/update.
- Resources CRUD only — no tickets, ideas, projects, or AI generation here.

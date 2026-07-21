---
name: forge-resources
description: Manage Forge resources via the forge-cli binary (create, list, get, update, delete). Use when the user asks to save a note, prompt, config, or code resource, list resources, update or delete a resource, or run forge-cli resource commands against InsForge.
---

# Forge resources (`forge-cli`)

Use the monorepo CLI binary **`forge-cli`** (not Laravel Forge’s `forge`). Prefer the global bin after `pnpm link --global` from `apps/cli`, or:

```bash
pnpm --filter @forge/cli forge-cli -- <command>
```

Resources sync to the InsForge `resources` table and RLS policies used by the web `/resources` tool. Auth is per-user; there is no offline mode.

## Prerequisites

One-time config (same InsForge project as `apps/web`):

```bash
forge-cli init --from-web-env
# or interactive: forge-cli init
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
  --title "ESLint flat" \
  --kind config \
  --content "{}" \
  --language json \
  --tool vscode \
  --version "9" \
  --tags eslint,lint
```

### Required fields (same rules as the web form)

| Flag | Rules |
|------|--------|
| `--title` | min 2 characters |
| `--kind` | `note` \| `prompt` \| `config` \| `code` |
| `--content` | required |
| `--language` | optional format (`json`, `yaml`, `javascript`, `typescript`, `markdown`, `env`, `plain-text`, `other`) |
| `--tags` | optional, comma-separated |
| `--tool` | required when `kind=config` |
| `--custom-tool` | required when `tool=other` |
| `--version`, `--context` | optional (config only) |

For kinds other than `config`, config metadata is stored as `null` (same as the web app).

## Other commands

```bash
forge-cli resource list
forge-cli resource list --json
forge-cli resource get <id> --json
forge-cli resource create ... --json
forge-cli resource update <id> --title "New title" --json
forge-cli resource delete <id>
```

`--json` applies to `create`, `list`, `get`, and `update`.

## Agent checklist

- Use **`forge-cli`**, never bare `forge`.
- Ensure `init` + `login` before resource mutations.
- Prefer `--json` when parsing results in automation.
- Kinds: `note`, `prompt`, `config`, `code`.
- Tools: `react-native`, `vscode`, `cursor`, `opencode`, `claude-code`, `other`.
- Resources CRUD only — no bookmarks, tickets, MCP, or AI generation here.

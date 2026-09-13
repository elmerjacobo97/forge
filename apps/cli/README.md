# `@codigoconelmer/forge-cli` (`forge-cli`)

Node CLI for Forge bookmarks, resources, Dev Board projects, and tickets against the linked Forge InsForge backend.

npm package: **`@codigoconelmer/forge-cli`**. Binary name is **`forge-cli`** (not `forge`) to avoid clashing with Laravel Forge CLI / Herd.

## Install (npm)

```bash
npm install -g @codigoconelmer/forge-cli
forge-cli --version
forge-cli --help
```

Package page: https://www.npmjs.com/package/@codigoconelmer/forge-cli

## Setup (from this monorepo)

```bash
# from repo root
pnpm install
pnpm --filter ./apps/cli build

# optional: put forge-cli on your PATH
cd apps/cli && pnpm link --global
```

Or run without a global link:

```bash
pnpm --filter ./apps/cli forge-cli -- --help
```

## npm Trusted Publishing (one-time setup)

Releases publish `@codigoconelmer/forge-cli` from GitHub Actions via
[Trusted Publishing](https://docs.npmjs.com/trusted-publishers) (OIDC). No
long-lived `NPM_TOKEN` is required for the happy path.

Configure once on npm (package or scope settings → **Trusted Publisher**):

| Field                | Value             |
| -------------------- | ----------------- |
| Provider             | GitHub Actions    |
| Organization or user | `elmerjacobo97`   |
| Repository           | `forge`           |
| Workflow filename    | `publish-cli.yml` |
| Environment name     | _(leave empty)_   |

The workflow file must remain `.github/workflows/publish-cli.yml` (filename
match is required). After this is saved on npm, pushing a tag `vX.Y.Z` whose
commit is on `main` and whose version matches `apps/cli/package.json` runs
build, test, and `npm publish` with provenance.

## Release flow

Publish only from **`main`**. Do **not** create release tags from `development`
or other feature branches — the workflow rejects tags whose commit is not on
`origin/main`.

1. Merge the release work into `main`.
2. On `main`, bump `version` in `apps/cli/package.json` (e.g. `0.1.0`) and
   commit that change on `main`.
3. Create the matching tag on that same `main` commit:
   ```bash
   git checkout main
   git pull origin main
   # version in apps/cli/package.json must already be X.Y.Z
   git tag vX.Y.Z
   git push origin vX.Y.Z
   ```
4. GitHub Actions (`.github/workflows/publish-cli.yml`) verifies the tag
   matches `version`, builds and tests the CLI, then publishes to npm with
   provenance.
5. Confirm with:
   ```bash
   npm install -g @codigoconelmer/forge-cli
   forge-cli --version
   forge-cli --help
   ```

Local check before tagging:

```bash
pnpm check-cli-release-tag -- vX.Y.Z
```

## Configure and sign in

From this monorepo, `init` can read `NEXT_PUBLIC_INSFORGE_URL` and
`NEXT_PUBLIC_INSFORGE_ANON_KEY` from `apps/web/.env.local` (or Vite-prefixed
equivalents from `apps/web/.env`):

```bash
forge-cli init --from-web-env
# or interactive with detected defaults
forge-cli init
# or explicit values
forge-cli init --url https://project.region.insforge.app --anon-key <key>

forge-cli login --email you@example.com
forge-cli whoami
forge-cli logout
```

Config and session live under `~/.forge/` with `0600` file modes. Config stores
the InsForge URL and public anon key. Session stores user ID plus Node/mobile
access and refresh tokens; authenticated commands refresh and rotate these
tokens before database access.

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

## Resources

```bash
forge-cli resource create \
  --title "ESLint flat" \
  --kind config \
  --content "{}" \
  --language json \
  --tool vscode \
  --version "9" \
  --tags eslint,lint

forge-cli resource list
forge-cli resource list --json
forge-cli resource get <id> --json
forge-cli resource update <id> --title "New title"
forge-cli resource delete <id>
```

Kinds: `note` | `prompt` | `config` | `code`. Tools (required for `config`):
`react-native` | `vscode` | `cursor` | `opencode` | `claude-code` | `other`.
When `tool` is `other`, pass `--custom-tool`. Config metadata (`--tool`,
`--custom-tool`, `--version`, `--context`) is stored only for `kind=config`.
Resources sync to the InsForge `resources` table (same as the web `/resources`
tool). `--json` applies to `create|list|get|update|delete`.

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

`--name` is required on create (1-80). `--description` defaults to `""` (max
2000). Delete uses `delete_empty_dev_board_project` and fails if tickets remain.
`--json` applies to `create|list|get|update|delete`.

## Dev Board tickets

```bash
forge-cli ticket create --project-id <projectId> --title "Ship CLI tickets"
forge-cli ticket create --project-id <projectId> --title "WIP" --column in_progress --priority high
forge-cli ticket list --project-id <projectId>
forge-cli ticket list --project-id <projectId> --column todo --json
forge-cli ticket get <id>
forge-cli ticket update <id> --title "New title" --priority med
forge-cli ticket update <id> --branch dev/handoff --pr-url "https://github.com/acme/forge/pull/17"
forge-cli ticket update <id> --clear-branch --clear-pr-url
forge-cli ticket move <id> --column in_progress
forge-cli ticket move <id> --column validation
forge-cli ticket move <id> --column review --branch dev/handoff --pr-url "https://github.com/acme/forge/pull/17"
forge-cli ticket adjust-time <id> --set 1h30m
forge-cli ticket adjust-time <id> --remove-last
forge-cli ticket adjust-time <id> --stop-at now
forge-cli ticket next
forge-cli ticket next --project-id <projectId> --json
forge-cli ticket comment <id> --body "Handoff notes" --author agent
forge-cli ticket comments <id> --json
forge-cli ticket report
forge-cli ticket report --days 7 --json
forge-cli ticket report --column review --column done
forge-cli ticket delete <id> --json
```

`--project-id` is required on `create` and `list` and optional on `next`
(default: all projects). Columns: `backlog` | `todo` | `in_progress` |
`validation` | `review` | `done`. Priorities: `low` | `med` | `high`. Ticket writes use
backend RPCs so moves, timers, events, and time entries remain atomic.
Timer-active columns are `in_progress` and `validation`; moving between them
keeps the timer running, and `review`/`done` stop it.

`adjust-time` fixes logged time with exactly one flag: `--set <duration>`
rewrites the last closed session, `--remove-last` deletes it, and
`--stop-at <now|iso>` stops the running session at that time (`now` equals a
pause). Durations require a unit (`30m`, `90m`, `1h30m`, `2h`; `0m` removes the
session). With the timer running, `--set` edits the previous closed session;
use `--stop-at` for the current one. Every duration change leaves an audit
comment on the ticket (written by the backend).

`next` returns the best pending `todo` ticket ranked by priority
(`high → med → low`, ties by board position) plus its project, its comments,
and an `inProgress` warning list (tickets in `in_progress` or `validation`).
With no pending work, text says `No pending tickets.` and `--json` returns
`{ "ticket": null, ... }` (exit 0). `next` is read-only.

`comment` requires `--body` (1–5000) and accepts `--author user|agent`
(default `user`); comments are append-only plain text, listed oldest first by
`comments` (the web dialog renders their GFM markdown; the CLI prints the raw
body). Handoff fields: `--branch` (1–200), `--pr-url` (http/https, max
2048), `--clear-branch`, `--clear-pr-url`. `update` without them keeps the
current values; `move` writes the handoff atomically with the column change.

`report` summarizes activity for the weekly meeting: every ticket with events
or comments inside a rolling window (default 7 days), with its project, its
in-window events, and its in-window comments. `--days` (1-90), `--since` /
`--until` (ISO 8601; `--since` overrides `--days`), `--column` (repeatable,
filters by the ticket's current column), and `--project-id` (optional scope).
Tickets currently in `backlog` are always excluded. `--json` returns
`{ from, to, days, tickets }`.

`--json` applies to every ticket command. With it, delete returns
`{"deleted":true,"id":"..."}` and any error prints
`{"error":{"message":"..."}}` to stderr with exit code 1 while stdout stays
clean. Existing `--json` responses keep camelCase output fields; commands
without `--json` keep their text output.

## JSON output and errors

`--json` is available on every command across `bookmark`, `resource`,
`project`, and `ticket`, including the `delete` subcommands. Deletes accept
`--json` and return `{"deleted":true,"id":"..."}`. When `--json` is active,
failures write `{"error":{"message":"..."}}` to stderr and exit 1; stdout
carries only the successful payload.

## Tests

```bash
pnpm --filter ./apps/cli test
```

Unit tests validate command inputs, stable formatting, and untrusted InsForge
row/RPC response mapping. They do not call the live backend.

## Agent skills

The `forge-*` skills (bookmarks, resources, projects, tickets, weekly) live in the global agent skill directory, not in this repo:

- Source of truth: `~/.agents/skills/forge-<area>/`
- Claude Code symlinks: `~/.claude/skills/forge-<area>`

They drive the global `forge-cli` binary, so they work from any directory.

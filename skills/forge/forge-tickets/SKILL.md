---
name: forge-tickets
description: "Use when managing Forge Dev Board tickets with forge-cli: create, list, get, update, delete, move, next, comment, work a ticket by id, move a card, pick the next pending ticket, leave handoff comments, open a board ticket while a spec is written, or annotate a spec's groups on the board."
license: MIT
metadata:
  author: elmerjacobo97
  version: "1.0.0"
---

# Forge Dev Board tickets (`forge-cli`)

Use the global binary **`forge-cli`** (not Laravel Forge’s `forge`):

```bash
npm install -g @codigoconelmer/forge-cli@latest
forge-cli --version   # requires >= 0.5.0 (comments, next, validation column, --branch, --pr-url, report)
# `adjust-time --set-total` requires >= 0.8.0
```

If the installed version is older than 0.5.0, update it before any ticket mutation — older binaries lack commands the agent loop depends on and fail with `Unknown ticket command`.

Tickets sync to the same InsForge tables and transactional RPCs as the web app. Auth is per-user; there is no offline mode. Every ticket belongs to a **project** (`--project-id`).

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
# or interactive: forge-cli login
forge-cli whoami
```

Session and config live in `~/.forge/` (`config.json`, `session.json`) with mode `0600`.

If you do not have a project id yet, create one first (skill `forge-projects`):

```bash
forge-cli project create --name "My board" --json
# → use the returned id as --project-id
```

## Work a specific ticket (ID-first)

When the user asks to work on a ticket and gives its id — copied from the web board card menu → **Copy ID** — the first action is always to move it to `in_progress`:

```bash
forge-cli ticket move <id> --column in_progress
```

Do this immediately, before planning, investigating, or reading any code: the timer must be running while you think. Re-running is safe — moving a ticket to the column it is already in is a no-op.

Then load full context:

```bash
forge-cli ticket get <id> --json
forge-cli ticket comments <id> --json
```

`get` returns the ticket (title, description, column, priority, timer, branch, PR). `comments` returns the append-only thread.

Every mutation takes the id: `move`, `update`, `comment`, `delete`. Use `ticket list --project-id <id>` only to browse, and `ticket next` only when the user asks for the next pending ticket without naming one.

## Plan mode (read-only harness)

When the harness has plan mode active, ticket mutations are forbidden: you cannot move the ticket to `in_progress` until the owner switches to build mode. Do not fake the move or skip loading context.

While in plan mode:

- Load context and investigate normally (`ticket get`, `ticket comments`, code).
- Track when the ticket work started and estimate the planning duration; you will backfill it on the build switch.

On the build switch, the first action is still the `in_progress` move. Then backfill the planning time (approximate, round to 5m) when the ticket has no time entries yet:

```bash
forge-cli ticket move <id> --column in_progress
forge-cli ticket adjust-time <id> --set-total 20m   # the planning time that already elapsed
```

- `--set-total` sets the logged total directly (RPC `set_total`, the same fallback the web uses) and requires the ticket to have **no time entries**. If it fails with `Ticket has time entries; edit the last session instead`, skip the backfill and mention it in the handoff comment.
- The backfill lives in the ticket total, not in a time entry: a later `--set`, `--remove-last` or `--stop-at` recomputes the total from entries and drops it. After backfilling, move columns normally.
- Needs `forge-cli >= 0.8.0`; older binaries do not know `--set-total` and fail with `Provide exactly one of --set, --remove-last or --stop-at.`

## Spec / OpenSpec-driven tickets

A ticket can be a slice of an approved spec or OpenSpec change. The plan lives in the repo; the ticket fences the scope and tracks state and time. `/spec` and `/spec-impl` do not know Forge. This skill is the only place that creates or moves those tickets, and only when the owner asks.

Reference convention — write it in the description when the tickets are created:

- `Spec: specs/NN-slug.md — Group N` for one implementation group of the repo's spec flow.
- `Spec: specs/NN-slug.md — diseño` only while the spec file does not exist yet.
- `Change: openspec/changes/<name> — <section>` for OpenSpec; one ticket per section of `tasks.md`.

Do not hand a ticket id to `/spec-impl`. That command implements the whole spec. A group ticket is worked with `trabaja el ticket <id>` (Open work). If the owner runs `/spec-impl` without asking to annotate groups, leave the board alone.

### While the spec is being written

When the owner is about to write a spec and wants that time on the board ("voy a armar una spec", "abre el ticket de la spec"), create one ticket before any spec questions:

```bash
forge-cli ticket create \
  --project-id <projectId> \
  --title "SPEC: <one-sentence objective>" \
  --description "Spec: specs/NN-slug.md — diseño" \
  --column in_progress
```

Use the real `NN-slug` when it is already known. Until the file exists, keep the description as `Spec: pendiente — diseño`. The timer runs while the spec is discussed, written, and reviewed. This skill does not write the spec.

Approving the spec changes the file only. Do not pause the timer and do not move the ticket. The time spent reviewing it until the owner marks it Approved is part of the implementation and stays on the running timer. Do not run `adjust-time --stop-at now` for that.

### Annotate the groups

When the owner asks to put the spec's groups on the board ("anota los grupos", "anótalo en el board"), read `specs/NN-slug.md` and use its `### Group N` headings. Do not ask the owner to restate the plan.

- If the design ticket for that spec exists, `ticket update` it into Group 1. Keep its column and its logged time. Do not move it to `validation`.

```bash
forge-cli ticket update <designTicketId> \
  --title "T1 SPEC NN: <group 1 name>" \
  --description "Spec: specs/NN-slug.md — Group 1"
```

- Create every other group in `todo`:

```bash
forge-cli ticket create --project-id <projectId> \
  --title "T3 SPEC NN: <group name>" \
  --description "Spec: specs/NN-slug.md — Group N" \
  --column todo \
  --priority med
```

If there is no design ticket, create every group in `todo`, including Group 1. Print each new id.

### Working one group

When a ticket's title, description, or comments carry a `Spec:` or `Change:` reference, working it means:

1. Move it to `in_progress` first. If `ticket get` shows it paused in `in_progress`, a same-column move does not resume the timer: move it to `todo`, then to `in_progress`.
2. Read the referenced files before touching code:
   - Spec flow: `specs/NN-slug.md` — state line, scope, implementation plan, acceptance criteria. Write code only if the state means "Approved". Otherwise tell the owner the spec must be marked Approved, and wait. Do not pause the timer and do not move the ticket while waiting.
   - OpenSpec: `proposal.md`, `design.md`, the delta specs, and the referenced section of `tasks.md`.
     The spec/change is the source of truth for what to build; the ticket is the scope fence.
3. Implement only the ticket's section/steps. Do not run the whole plan, and do not run `/spec-impl`.
4. Mark `[x]` only that section's checkboxes: the group's steps in the spec, or that section of `tasks.md` for OpenSpec. Do not edit the spec's `Estado` / `Status` line. Leave the checkbox edit in the working tree — do not commit. Commits happen only on the owner's explicit close order (Close work).
5. Branch: use the normal ticket branch from the default branch (Git workflow, Open work, step 5). If a work branch for this ticket already exists, reuse it. Never create `spec-NN-slug` on top.
6. One active ticket per spec or change at a time: parallel branches editing the same spec file or `tasks.md` conflict.
7. Handoff: comment with the spec/change and section plus verification, then move to `validation` with `--branch`, as usual. `validation` is when this group's implementation is finished, not when the spec file was approved.

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

### Splitting a spec or OpenSpec change into tickets

Follow **Annotate the groups** above: one ticket per implementation-plan group (spec flow) or per `tasks.md` section (OpenSpec), not per individual step. The group the owner already tracked while writing the spec becomes Group 1; the rest are created in `todo`. Put the reference in `--description` so the working session knows where the plan lives:

```bash
forge-cli ticket create --project-id <projectId> \
  --title "T3 SPEC 21: CLI forge-cli idea" \
  --description "Spec: specs/21-ideas-tool.md — Group 3" \
  --column todo \
  --priority med
```

### Fields

| Flag            | Rules                                                                                          |
| --------------- | ---------------------------------------------------------------------------------------------- |
| `--project-id`  | required; must exist and belong to the signed-in user                                          |
| `--title`       | required, 1–120 characters                                                                     |
| `--description` | optional, default `""`, max 2000                                                               |
| `--priority`    | `low` \| `med` \| `high` (default `med`)                                                       |
| `--column`      | `backlog` \| `todo` \| `in_progress` \| `validation` \| `review` \| `done` (default `backlog`) |

Creating with a timer-active column (`in_progress` or `validation`) starts the timer (same semantics as the web board).
Create without `--project-id`, or with an id that is missing / not yours, exits non-zero and does not create a ticket.

Invalid input exits non-zero with a clear error — fix flags and retry. Do not invent an API key; login uses email/password only.

## Move a ticket

Change column with `move` (not `update`). Move appends to the end of the destination column and applies timer/events like the web:

```bash
forge-cli ticket move <id> --column in_progress
forge-cli ticket move <id> --column validation
forge-cli ticket move <id> --column done --json
```

Timer-active columns are `in_progress` and `validation`. Entering either starts the timer, moving between them keeps it running, and leaving both with an active timer writes a time entry. `review` and `done` do not count time.

`move` also accepts the handoff flags (`--branch`, `--pr-url`, `--clear-branch`, `--clear-pr-url`) and writes them atomically with the column change.

## Adjust time

Fix the logged time of a ticket with exactly one flag:

```bash
forge-cli ticket adjust-time <id> --set 1h30m     # rewrite the last closed session
forge-cli ticket adjust-time <id> --set-total 20m # set the logged total (no time entries yet)
forge-cli ticket adjust-time <id> --remove-last  # delete the last closed session
forge-cli ticket adjust-time <id> --stop-at now  # stop the running session (now = pause)
```

- Durations require a unit: `30m`, `90m`, `1h30m`, `2h`; `0m` removes the session.
- `--set` edits the last **closed** session; with the timer running it edits the previous one. Use `--stop-at` for the current run.
- `--set-total` sets `total_elapsed_ms` directly and only works when the ticket has no time entries (backfill planning time); later `--set`, `--remove-last` or `--stop-at` recompute the total from entries and drop it.
- `--stop-at` accepts `now` or an ISO 8601 timestamp and leaves the ticket paused.
- Every duration change writes an audit comment on the ticket (backend RPC).

## Agent ticket loop

Use this loop when working a ticket end to end as an agent. If the user already gave you a ticket id, skip ranking: move it to `in_progress` first (step 2) — before planning, investigating, or reading code — then load context with `forge-cli ticket get <id> --json` and `forge-cli ticket comments <id> --json`.

1. **Pick work**: `forge-cli ticket next --json` returns the best pending `todo` ticket, ranked by priority (`high → med → low`) with ties broken by board position. It also returns the ticket's project, its comments, and any tickets already active in `in_progress` or `validation` (a warning, not a blocker). Add `--project-id <id>` to scope both the candidates and the active list to one project.

   ```bash
   forge-cli ticket next
   forge-cli ticket next --project-id <projectId> --json
   ```

   `next` is read-only: it never moves tickets or writes comments. When there is no `todo` work, the text says `No pending tickets.` and `--json` returns `{ "ticket": null, ... }` (exit code 0).

2. **Start**: `forge-cli ticket move <id> --column in_progress` (starts the timer). If the harness was in plan mode first, backfill the planning time right after the move (see "Plan mode").
3. **Work** the ticket.
4. **Hand off**: comment first, then move to `validation` with the branch in the same call. This is where the agent's column moves end.
   - `validation` is the owner/agent verification loop: implementation is done but not approved yet; the timer keeps running while bugs are found and fixed. All adjustments happen here, not after review.
   - `review` and `done` are **owner-only**: never move a ticket there on your own, not even when the owner says "cierra el ticket". The only exception is an explicit order in the current message ("move the ticket to review" / "move it to done"). Otherwise remind the owner to move it manually once verified.

   ```bash
   forge-cli ticket comment <id> --body "Implemented X; tests green" --author agent
   forge-cli ticket move <id> --column validation --branch dev/handoff
   # only when the current message explicitly orders it:
   forge-cli ticket move <id> --column review \
     --pr-url "https://github.com/acme/forge/pull/17"
   ```

## Git workflow

Match **intent, not exact wording**. Any phrasing in any language counts. Non-exhaustive examples:

- **Open work:** "trabaja el ticket <id>", "trabaja en el ticket <id>", "trabajemos el ticket <id>", "work ticket <id>", "work on ticket <id>", "let's work on ticket <id> with forge-cli", "pick up ticket <id>", "start ticket <id>".
- **Close work:** "cierra el ticket <id>", "cierra el ticket", "close the ticket", "finish the ticket", "complete the ticket", "merge and close", "ship it".

If a ticket id appears together with an order to start or finish work — even embedded in another payload (design feedback, bug report, review notes) — treat it as a trigger: load this skill, move the ticket to `in_progress` immediately, and only then plan or touch code.

### Open work — "trabaja el ticket <id>" / "work on ticket <id>"

1. **Move to `in_progress` first**: `forge-cli ticket move <id> --column in_progress` — before planning, investigating, or any git step. The timer must run while you think. Re-running is safe (same-column move is a no-op).
2. Load context: `forge-cli ticket get <id> --json` and `forge-cli ticket comments <id> --json`.
3. Resolve the default branch (never assume `main`):
   - `git symbolic-ref --short refs/remotes/origin/HEAD` → strip `origin/` (e.g. `main`, `development`).
   - Fallback: `git remote show origin` → "HEAD branch".
   - Fallback order for local-only repos: `development`, `develop`, `main`, `master`.
   - If still ambiguous, ask the owner before branching.
4. Sync: `git fetch origin`, `git checkout <default>`, `git pull --ff-only origin <default>`. If the pull fails, stop and report — do not force or stash silently.
5. Create the branch `<type>/<slug>`:
   - `<type>` inferred from the ticket title: `fix`, `refactor`, `docs`, `chore`; default `feat`.
   - `<slug>`: short kebab-case from the title (lowercase, hyphens, no accents).
   - If the ticket references a spec/change and a work branch for it already exists, check it out instead of creating a new one (see "Spec / OpenSpec-driven tickets").

### Close work — "cierra el ticket" / "close the ticket"

Committing is close-only: during open work the agent leaves every change — implementation and the `tasks.md` checkbox update — uncommitted so the owner can review the working tree. Never commit before the owner explicitly orders close.

1. Commit the branch's pending work with a Conventional Commit message (`feat:`, `fix:`, `refactor:`, `docs:`, `chore:`). Stage only intended files; never commit secrets.
2. `git checkout <default>` and `git pull --ff-only origin <default>`.
3. `git merge --no-ff <branch> -m "Merge branch '<branch>'"` — unless the repo documents a different strategy in `AGENTS.md`/`CLAUDE.md`. On conflicts, stop and report; do not resolve blind.
4. `git branch -d <branch>`.
5. **Do not change the ticket column.** Closing never moves the ticket: it stays in `validation` (adjustments happen there). Remind the owner to move it to `review` and later `done` manually — unless the current message explicitly orders that move.
6. **Never push.** The owner pushes manually. Only run `git push` when explicitly asked in the same message.
7. Report: commit hash, merge commit, branch deleted, the ticket left in `validation` for the owner's manual `review`/`done` move, and that push is pending on the owner.

## Comments

Comments are append-only plain text (1–5000 characters), ordered oldest first. There is no edit, delete, markdown, or pagination; do not attempt those.

**Keep agent comments short (1–3 lines).** State outcome, verification, and blockers only. Do not paste changelogs, file lists, hashes, timings, or a play-by-play — details live in the code, the branch, and the diff. The web dialog renders markdown, so bullet lists are fine, but a one-liner is preferred.

```bash
forge-cli ticket comment <id> --body "Handoff notes"        # author defaults to user
forge-cli ticket comment <id> --body "Done; tests green" --author agent
forge-cli ticket comments <id>
forge-cli ticket comments <id> --json
```

`comment` on a missing or foreign ticket exits non-zero with `Ticket not found.` and creates nothing.

## Handoff fields

`ticket update` and `ticket move` accept:

| Flag              | Effect                                   |
| ----------------- | ---------------------------------------- |
| `--branch <name>` | bind a git branch (1–200 characters)     |
| `--pr-url <url>`  | bind a PR URL (`http`/`https`, max 2048) |
| `--clear-branch`  | clear the branch                         |
| `--clear-pr-url`  | clear the PR URL                         |

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
forge-cli ticket adjust-time <id> --set 1h30m --json
forge-cli ticket adjust-time <id> --set-total 20m --json
forge-cli ticket comment <id> --body "Notes" --author agent --json
forge-cli ticket comments <id> --json
forge-cli ticket report --days 7 --json
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
- When the owner names a ticket to work on (any phrasing, any language), move it to `in_progress` immediately — before planning, investigating, or touching code. Planning time counts; the timer must be running. Re-running the move is safe (same-column move is a no-op). If the ticket is paused in `in_progress`, move it to `todo` and then to `in_progress` so the timer resumes.
- A spec's board time starts only when the owner asks for it: one `in_progress` ticket while the spec is written and reviewed. Approving the spec does not pause the timer and does not move the ticket to `validation`. If the spec is still a draft, say it must be marked Approved and leave the timer running.
- Annotate spec groups only when the owner asks. The design ticket becomes Group 1; other groups are created in `todo`. Work each id with this skill, not with `/spec-impl`. `/spec-impl` without that ask leaves the board unchanged.
- On a spec group, mark `[x]` only that group's steps and do not edit the spec state line.
- Always pass `--project-id` on `ticket create` and `ticket list`.
- Prefer `--json` when parsing results in automation.
- Change column only via `ticket move`, never `ticket update`.
- Comment handoff as `--author agent`; comments are append-only (no edit/delete). Keep them short (1–3 lines): outcome, verification, blockers. The web Comments dialog renders GFM markdown; the CLI prints the raw body.
- Never commit during open work: no commit for the implementation, the tests, the spec group's checkbox update, or the OpenSpec `tasks.md` checkbox update. Leave the changes in the working tree; commit only when the owner explicitly orders close ("cierra el ticket", Close work).
- Column moves by the agent end at `validation` (owner/agent verification, timer keeps running; adjustments happen there). `review` and `done` are owner-only: never move there on your own, not even when the owner says "cierra el ticket". Only an explicit order in the same message ("move it to review/done") authorizes it — otherwise remind the owner to move it manually.
- Columns only: `backlog`, `todo`, `in_progress`, `validation`, `review`, `done`.
- Priorities only: `low`, `med`, `high`.
- Do not pause/resume timers via raw `set_dev_board_ticket_timer`, read analytics, reorder with `--position`, move tickets between projects, or cascade-delete events — out of scope for this CLI surface. Time corrections go through `ticket adjust-time` (`--set`, `--set-total`, `--remove-last`, `--stop-at`).
- Projects stay under `forge-cli project` / skill `forge-projects`. Bookmarks stay under `forge-cli bookmark` / skill `forge-bookmarks`.
- Weekly activity summaries for the Friday meeting: use skill `forge-weekly` (`forge-cli ticket report`). It is read-only; never mix a report with ticket mutations.

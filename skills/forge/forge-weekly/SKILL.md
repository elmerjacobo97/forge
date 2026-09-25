---
name: forge-weekly
description: "Use when building a weekly Forge Dev Board activity report for the Friday meeting, including reporte semanal, actividades de la semana, or weekly report. Requires forge-cli >= 0.5.0."
license: MIT
metadata:
  author: elmerjacobo97
  version: "1.0.0"
---

# Weekly activity report (`forge-cli ticket report`)

Summarize what the owner worked on, for the Friday afternoon meeting. Data comes from the Dev Board: ticket events (created/moved/started/completed/paused/resumed), comments, and current columns. This is **not** a time tracker: no hours, no durations, no timestamps in the narrative.

## Preconditions

- `forge-cli --version` must be `>= 0.5.0` (adds `ticket report`). If older: `npm install -g @codigoconelmer/forge-cli@latest`.
- Auth works (`forge-cli whoami`); if not, run the `forge-tickets` skill login steps first.

## Workflow

1. Fetch the window (read-only):

   ```bash
   forge-cli ticket report --days 7 --json
   ```

   **Rolling window**: the last 7 days ending now. Work done Friday night, Saturday, or Sunday is inside this window and lands in the **next** Friday's report — the current meeting covers the week that just ended, so nothing is lost or double-counted. Keep `--days 7` unless the owner gives another range or scope:
   - `--since <iso>` / `--until <iso>` for an explicit range (`--since` overrides `--days`),
   - `--column <column>` (repeatable) to narrow by current column — use `--column review --column done` when the owner asks only for finished work,
   - `--project-id <id>` to scope a single project.

2. Read `tickets[]`. Each entry has `ticket`, `project`, `events`, `comments`. Tickets currently in `backlog` never appear (creating a ticket is not work). A ticket appears only if it has activity inside the window, and it shows its **current** column, so work still in progress counts.

3. Write the report in the owner's language (default Spanish), in chat only:
   - One-line summary first: projects touched, tickets done, waiting in review/validation, still in progress.
   - Group by project. One bullet per ticket: what was done (one phrase) plus current state.
   - Classify each activity by intent, inferred from title, comments, and branch: `fix`, `feat`, `refactor`, `docs`, `chore`, `mejora`, `investigación`. If intent is unclear, use neutral wording — never invent it.
   - Mention the weekday (viernes, sábado, domingo…) only when it adds context; weekend work is normal in the rolling window and does not need to be flagged unless the owner wants that.
   - Aim for 10–20 bullets: readable aloud, not a changelog.

4. Never include: hours, durations, timers, raw ISO timestamps, event-type dumps, ticket ids, or file lists.

## Rules

- **Read-only**: while building a report, never move tickets, write comments, or touch code.
- Empty `tickets[]`: say there was no tracked activity in the window and offer `--since` for a different range.
- Meetings or work not on the board: add a short "Otros" section only if the owner dictates it; mark it as owner-provided, never invented.
- Asked for finished work only: add `--column review --column done`. Otherwise keep the full picture (in-progress work included).

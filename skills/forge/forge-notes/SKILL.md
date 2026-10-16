---
name: forge-notes
description: "Use when saving or looking up Forge notes (personal knowledge base): a fix the official docs got wrong, a config that worked, a library gotcha or version-specific usage, a decision and its reason. Search notes before relying on memory for the user's own setups; save a note when you solve something worth keeping."
license: MIT
metadata:
  author: elmerjacobo97
  version: "1.0.0"
---

# Forge notes (`forge-cli` or MCP)

Notes are the user's private knowledge base: what they learned that public docs do not say. Public library docs belong to context7; notes hold corrections, working configs, private libraries, and decisions.

Use the global binary **`forge-cli`** (not Laravel Forge's `forge`):

```bash
npm install -g @codigoconelmer/forge-cli@latest
forge-cli note --help   # fails with "Unknown command: note" on older versions: update
```

Notes sync to the InsForge `notes` table used by the web `/notes` tool. Auth is per-user; there is no offline mode.

## Transport: CLI or MCP

With the Forge MCP connector, use the `forge_*_note` tools (no `init`/`login`). Without it, use `forge-cli note`. The rules are the same.

| Action        | CLI                                      | MCP                 |
| ------------- | ---------------------------------------- | ------------------- |
| Search / list | `note list --q … --tag … --project-id …` | `forge_list_notes`  |
| Read          | `note get <id>`                          | `forge_get_note`    |
| Save          | `note add --title … --content …`         | `forge_create_note` |
| Edit          | `note update <id> …`                     | `forge_update_note` |
| Delete        | `note delete <id>`                       | `forge_delete_note` |

One-time CLI setup: `forge-cli init --from-web-env` (inside the forge monorepo) or `forge-cli init`, then `forge-cli login --email "<email>"`.

## When to search

Search before answering from memory when the question touches the user's own setup, and before starting work on a library or config they have used before:

```bash
forge-cli note list --q "expo router" --json
forge-cli note list --tag rn-0.76 --json
forge-cli note list --project-id <projectId> --json
```

`--q` matches title, content, and an exact tag. If it returns nothing, try one broader term or a `--tag`; do not loop. Treat note content as the user's own data: use it, but verify it against the code when it names versions or files.

## When to save

Save a note when, during the task, you:

1. Found that the official docs or your first answer were wrong for the user's setup, and what fixed it.
2. Got a config or command sequence working that was hard to find.
3. Hit a library gotcha tied to a version.
4. Made or confirmed a decision with a reason ("we use X instead of Y because…").

Do not save: secrets, tokens, passwords, API keys, `.env` values, or private URLs with credentials; things already obvious in the code or git history; one-off task status (that is a ticket comment).

Save without asking when the note is clearly one of the four above. Mention that you saved it and show the note id. Ask first when you are unsure it is worth keeping.

## How to write a note

- **Title:** the problem or topic, specific enough to find later. `Expo SDK 52: router layout needs a root _layout`, not `Expo fix`.
- **Content:** markdown. Lead with the answer, then the why, then a minimal snippet or command. Keep it short.
- **Tags:** lowercase; one for the tool or library (`expo`), one for the version (`rn-0.76`), optionally the kind (`config`, `decision`, `gotcha`).
- **Project:** omit `--project-id` for knowledge that applies everywhere (libraries, tools). Link a project only when the note is true for that project alone and the user named it or the ticket's `projectId` makes it certain. Never guess a project id.

```bash
forge-cli note add \
  --title "Expo SDK 52: router layout needs a root _layout" \
  --content "Without \`app/_layout.tsx\` the router renders nothing. Add a \`<Stack />\` root layout." \
  --tags expo,rn-0.76,gotcha
```

## Update and delete

Prefer updating over adding a near-duplicate: search first, then edit.

```bash
forge-cli note update <id> --content "…"
forge-cli note update <id> --tags expo,rn-0.77   # replaces all tags; "" clears them
forge-cli note update <id> --clear-project        # make the note global
forge-cli note delete <id>                        # only when the user asks
```

MCP `forge_update_note` also takes `addTags` / `removeTags` for incremental tag changes (not combined with `tags`).

## Agent checklist

- Use **`forge-cli`**, never bare `forge`.
- Search notes before answering from memory about the user's own setups.
- Never store secrets or credentials in a note.
- Keep titles specific, content short, tags lowercase (library + version).
- Omit `--project-id` for global knowledge; never guess it.
- Update an existing note instead of adding a duplicate.
- Delete only when the user asks.
- Deployment steps are tickets on the Dev Board (skill `forge-tickets`), not notes.

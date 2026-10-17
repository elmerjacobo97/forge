---
name: forge-flows
description: "Use when mapping a project's code into Forge: write the project's modules and step-by-step flows (button to table) from the repo and its graphify graph, so the user can read them at /dev-board/<projectId>/flows. Trigger on: map this project, document the flow of X, how does X work in Forge, update the project map."
license: MIT
metadata:
  author: elmerjacobo97
  version: "1.0.0"
---

# Forge project flows (`forge-cli` or MCP)

Forge stores and draws; **you generate**. A flow is the path of one action through the code, from the UI to the database, as 4 to 8 steps that each cite `file:line`. The user reads it on the web to understand how the code is wired.

Use the global binary **`forge-cli`** (not Laravel Forge's `forge`): `npm install -g @codigoconelmer/forge-cli@latest`.

## Transport: CLI or MCP

| Action        | CLI                                            | MCP                           |
| ------------- | ---------------------------------------------- | ----------------------------- |
| Read map      | `project map get <projectId>`                  | `forge_get_project_map`       |
| Read flow     | `project map flow get <projectId> <slug>`      | `forge_get_project_flow`      |
| Write module  | `project map module set <projectId> <slug>`    | `forge_upsert_project_module` |
| Write flow    | `project map flow set <projectId> --file …`    | `forge_upsert_project_flow`   |
| Delete module | `project map module delete <projectId> <slug>` | `forge_delete_project_module` |
| Delete flow   | `project map flow delete <projectId> <slug>`   | `forge_delete_project_flow`   |

Get the `projectId` from the user or `forge-cli project list` (skill `forge-projects`). Never guess it.

## Rules

- **Only what the code shows.** Every step comes from code you read or a graph edge. Never invent a step, a function, or a connection.
- **On demand.** Write the flow the user asked for. Do not generate every flow of a module.
- **Reuse slugs.** Read the map first (`map get`). Upserting an existing slug replaces it; a new slug creates a duplicate.
- **4 to 8 steps** per flow (hard limit 20). Cut helpers that do not change what the reader learns.
- **No secrets** in `input`/`output`/`label`.

## 1. Modules from folders

Modules come from the repo layout, not from graphify communities (their names are arbitrary). One module per `features/<feature>`, `apps/*` or `packages/*` folder.

```bash
forge-cli project map module set <projectId> dev-board \
  --name "Dev Board" --description "Kanban board, tickets and timers" --depends-on auth,projects
```

- `slug`: lowercase letters, numbers, hyphens, max 60.
- `--depends-on`: slugs of modules that **already exist** in the project, never its own. Create the dependency first.
- Describe what the folder does in one line, from its code.

## 2. A flow from the graph

1. Find the entry point: `graphify query "<action the user named>"`.
2. Walk the chain: `graphify path "<entry>" "<table or service>"` and `graphify explain "<symbol>"`. Follow `calls` edges: action to service to database.
3. Read each file at the line you will cite. Confirm the symbol exists there.
4. Add the UI steps (`page`, `ui`) before the `action`. The button to dialog link is JSX and leaves few graph edges: read the component and mark those steps `inferred: true`.
5. If the CLI or MCP also reach the same service, add `command` and `tool` steps that converge on it.

### Step fields

| Field      | Rules                                                                  |
| ---------- | ---------------------------------------------------------------------- |
| `kind`     | `page` `ui` `action` `service` `db` `command` `tool`                   |
| `label`    | what happens in this step, one line (required)                         |
| `symbol`   | function or component name                                             |
| `file`     | path **relative to the repo**, never absolute                          |
| `line`     | line where the symbol starts                                           |
| `input`    | what the step receives                                                 |
| `output`   | what it returns                                                        |
| `inferred` | `true` when the step does not come from a graph edge (default `false`) |

### Write it

Save the flow as JSON and send it with one call (paths, lines and the commit below are illustrative; cite what you read):

```json
{
  "moduleSlug": "dev-board",
  "slug": "create-project",
  "title": "Create a project",
  "summary": "From the New project dialog to the dev_board_projects row.",
  "commit": "a1b2c3d",
  "steps": [
    {
      "kind": "ui",
      "label": "Dialog submits the form",
      "symbol": "ProjectForm",
      "file": "apps/web/src/features/dev-board/components/project-form.tsx",
      "line": 40,
      "inferred": true
    },
    {
      "kind": "action",
      "label": "Validate and call the service",
      "symbol": "createProjectAction",
      "file": "apps/web/src/features/dev-board/actions.ts",
      "line": 29,
      "input": "name, description",
      "output": "Project"
    },
    {
      "kind": "db",
      "label": "Insert the row",
      "symbol": "createProject",
      "file": "apps/web/src/features/dev-board/services/projects-service.ts",
      "line": 45,
      "output": "Project"
    }
  ]
}
```

```bash
forge-cli project map flow set <projectId> --file flow.json
```

- `commit`: `git rev-parse --short HEAD` at the time you read the code. Optional, max 40.
- `moduleSlug` must exist or the call fails with `Module not found.`.
- An invalid file fails before reaching the service. Fix the message and retry.

## Regenerate

Re-running with the same `slug` replaces the whole flow. Read the old one first, keep the steps that are still true, and update `commit`.

## Agent checklist

- Read the map before writing; reuse slugs.
- Every step cites `file:line` read from the repo; `inferred: true` when no graph edge backs it.
- 4 to 8 steps; UI steps first, then action, service, db.
- Create dependency modules before the modules that depend on them.
- Do not generate flows nobody asked for, and do not edit steps from the web (it only reads and deletes).
- Show the user `/dev-board/<projectId>/flows` when done.

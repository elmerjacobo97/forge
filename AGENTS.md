# AGENTS.md

## Scope
- This pnpm workspace contains the browser app at `apps/web` (`@forge/web`), the Appwrite Function at `functions/ai-content-generator` (`@forge/ai-content-generator`), and the Node CLI at `apps/cli` (`@forge/cli`, binary `forge-cli`).
- Keep `apps/web` browser-only. Server SDKs, secrets, provider calls, and remote page fetching belong in the Function. Do not add Tauri, Rust, native IPC, or desktop-only dependencies.
- Do not create speculative workspace packages; `packages/*` is only a reserved workspace glob.

## Commands
- Run commands from the repository root: `pnpm install`, `pnpm dev`, `pnpm build`, `pnpm test`, `pnpm doctor`.
- `pnpm build` and `pnpm test` verify web, Function, and CLI. Use `pnpm build:web`, `pnpm build:function`, `pnpm build:cli`, `pnpm test:web`, `pnpm test:function`, or `pnpm test:cli` for one package. There is no lint script or ESLint config.
- Run one web test with `pnpm --filter @forge/web exec vitest run <path>`, one Function test with `pnpm --filter @forge/ai-content-generator exec vitest run <path>`, or one CLI test with `pnpm --filter @forge/cli exec vitest run <path>`; omit `run` for watch mode.
- Vitest defaults to `environment: "node"` with globals enabled. Tests are `*.test.ts`; DOM APIs are unavailable unless a test opts into another environment.
- Dependency installs enforce a 24-hour minimum package age and a no-downgrade trust policy in `pnpm-workspace.yaml`.

## Structure
- Feature code owns its components, hooks, services, schemas, types, tests, and utilities under `apps/web/src/features/<feature>/`.
- Put shared UI in `apps/web/src/components/`; put reusable infrastructure and pure helpers in `apps/web/src/lib/`. Keep routes as thin feature composition files.
- Keep Function handlers, contracts, provider integration, network fetching, and tests under `functions/ai-content-generator/src/`.
- Keep the CLI under `apps/cli/src/` (commands, Appwrite client, bookmark/dev-board services, validation). Docs: `apps/cli/README.md`. Agent skills: `.claude/skills/forge-bookmarks/`, `.agents/skills/forge-bookmarks/`, `.claude/skills/forge-tickets/`, `.agents/skills/forge-tickets/`.
- Import source through `@/*` (`apps/web/src/*`) or direct relative files. Do not add barrel files.
- TypeScript is strict in both packages and rejects unused locals/parameters. Do not use `any`; validate browser, network, and model data as `unknown`.

## CLI (`forge-cli`)
- Binary name is `forge-cli` (not `forge`) to avoid clashing with Laravel Forge CLI / Herd.
- Build/link: `pnpm --filter @forge/cli build`, then `cd apps/cli && pnpm link --global`, or run `pnpm --filter @forge/cli forge-cli -- <args>`.
- Config/session: `~/.forge/config.json` and `~/.forge/session.json` after `forge-cli init` and `forge-cli login`. Config includes bookmarks + Dev Board table IDs (`devBoardTicketsTableId`, `devBoardEventsTableId`, `devBoardTimeEntriesTableId`).
- Bookmarks CRUD talks to the same Appwrite table as the web app (`forge-cli bookmark create|list|get|update|delete`). Use `--json` for machine-readable output on create/list/get/update.
- Dev Board tickets: `forge-cli ticket create|list|get|update|delete|move` against the same tables as the web app. Change column only via `move` (timer/events/time entries parity). Use `--json` on create/list/get/update/move.
- CLI unit tests must not call a real Appwrite project.

## Routing And Tools
- TanStack Router generates `apps/web/src/routeTree.gen.ts` during Vite dev/build. Never edit it manually.
- Public auth screens live under `apps/web/src/routes/_auth/`; authenticated screens live under `apps/web/src/routes/_authenticated/`, whose layout performs the session guard.
- Adding a utility requires its feature, a thin authenticated route, and an entry in `apps/web/src/lib/tools.ts`; that registry drives navigation and tool metadata.

## Appwrite
- Copy `apps/web/.env.example` to `apps/web/.env` for local configuration. All `VITE_*` values are browser-visible; never put secrets there.
- Reuse `client`, `account`, `tablesDB`, and `functions` from `apps/web/src/lib/appwrite.ts`; do not construct feature-local Appwrite clients.
- `VITE_APPWRITE_AI_CONTENT_FUNCTION_ID` is the public Function ID used by the web app. `GROQ_API_KEY` is a secret Appwrite Function variable and must never appear in `apps/web`, a `VITE_*` variable, or browser storage.
- `functions/ai-content-generator` runs on Node 22, accepts authenticated executions only, fixes the Groq model to `openai/gpt-oss-20b`, and validates fetched and generated data before responding.
- Function metadata lives in `appwrite.config.json`. Push it with `appwrite push function --function-id ai-content-generator --activate`; redeploy after changing Function variables.
- `apps/web/src/lib/appwrite-data.ts` stores simple feature payloads in the shared data table. Use a dedicated table only when query or scale needs justify it.
- Bookmarks and Snippets require both a signed-in user and configured Appwrite storage. They intentionally have no `localStorage` fallback.
- Theme tokens live in `apps/web/src/index.css`; shadcn configuration and aliases live in `apps/web/components.json`.

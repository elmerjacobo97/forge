# AGENTS.md

## Scope
- This is a pnpm workspace; `apps/web` (`@forge/web`) is currently the only package and deployable app.
- Keep `apps/web` browser-only. Do not add Tauri, Rust, native IPC, or desktop-only dependencies.
- Do not create speculative workspace packages; `packages/*` is only a reserved workspace glob.

## Commands
- Run commands from the repository root: `pnpm install`, `pnpm dev`, `pnpm build`, `pnpm test`, `pnpm doctor`.
- `pnpm build` is the configured typecheck plus production build (`tsc && vite build`). There is no lint script or ESLint config.
- Run one test file with `pnpm --filter @forge/web exec vitest run <path>`; omit `run` for watch mode.
- Vitest defaults to `environment: "node"` with globals enabled. Tests are `*.test.ts`; DOM APIs are unavailable unless a test opts into another environment.
- Dependency installs enforce a 24-hour minimum package age and a no-downgrade trust policy in `pnpm-workspace.yaml`.

## Structure
- Feature code owns its components, hooks, services, schemas, types, tests, and utilities under `apps/web/src/features/<feature>/`.
- Put shared UI in `apps/web/src/components/`; put reusable infrastructure and pure helpers in `apps/web/src/lib/`. Keep routes as thin feature composition files.
- Import source through `@/*` (`apps/web/src/*`) or direct relative files. Do not add barrel files.
- TypeScript is strict and rejects unused locals/parameters. Do not use `any`; validate untrusted values as `unknown`.

## Routing And Tools
- TanStack Router generates `apps/web/src/routeTree.gen.ts` during Vite dev/build. Never edit it manually.
- Public auth screens live under `apps/web/src/routes/_auth/`; authenticated screens live under `apps/web/src/routes/_authenticated/`, whose layout performs the session guard.
- Adding a utility requires its feature, a thin authenticated route, and an entry in `apps/web/src/lib/tools.ts`; that registry drives navigation and tool metadata.

## Appwrite
- Copy `apps/web/.env.example` to `apps/web/.env` for local configuration. All `VITE_*` values are browser-visible; never put secrets there.
- Reuse `client`, `account`, and `tablesDB` from `apps/web/src/lib/appwrite.ts`; do not construct feature-local Appwrite clients.
- `apps/web/src/lib/appwrite-data.ts` stores simple feature payloads in the shared data table. Use a dedicated table only when query or scale needs justify it.
- Bookmarks and Snippets require both a signed-in user and configured Appwrite storage. They intentionally have no `localStorage` fallback.
- Theme tokens live in `apps/web/src/index.css`; shadcn configuration and aliases live in `apps/web/components.json`.

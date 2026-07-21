# AGENTS.md

## Scope
- This pnpm workspace contains the Next.js app at `apps/web` (`@forge/web`) and Node CLI at `apps/cli` (`@forge/cli`, binary `forge-cli`).
- Keep secrets, provider calls, and remote page fetching in Server Components, Server Actions, or Route Handlers. Do not add Tauri, Rust, native IPC, or desktop-only dependencies.
- Do not create speculative workspace packages; `packages/*` is only a reserved workspace glob.

## Commands
- Run commands from the repository root: `pnpm install`, `pnpm dev`, `pnpm build`, `pnpm test`, `pnpm lint`, `pnpm format`, `pnpm doctor`.
- `pnpm build` and `pnpm test` verify web and CLI. Use `pnpm build:web`, `pnpm build:cli`, `pnpm test:web`, or `pnpm test:cli` for one package.
- Lint/format: ESLint 9 flat config (`eslint.config.mjs`) + Prettier (`.prettierrc`). `pnpm lint` / `pnpm lint:fix` for ESLint; `pnpm format` / `pnpm format:check` for Prettier. Do not use Biome.
- Run one web test with `pnpm --filter @forge/web exec vitest run <path>`, one Function test with `pnpm --filter @forge/ai-content-generator exec vitest run <path>`, or one CLI test with `pnpm --filter @forge/cli exec vitest run <path>`; omit `run` for watch mode.
- Vitest defaults to `environment: "node"` with globals enabled. Tests are `*.test.ts`; DOM APIs are unavailable unless a test opts into another environment.
- Dependency installs enforce a 24-hour minimum package age and a no-downgrade trust policy in `pnpm-workspace.yaml`.

## Structure
- Feature code owns its components, hooks, services, schemas, types, tests, and utilities under `apps/web/src/features/<feature>/`.
- Put shared UI in `apps/web/src/components/`; put reusable infrastructure and pure helpers in `apps/web/src/lib/`. Keep routes as thin feature composition files.
- Keep Route Handlers and server-only feature code under `apps/web/src/app/api/` and `apps/web/src/features/<feature>/server/`.
- Keep the CLI under `apps/cli/src/` (commands, InsForge client, bookmark/resource/project/dev-board services, validation). Docs: `apps/cli/README.md`.
- Import source through `@/*` (`apps/web/src/*`) or direct relative files. Do not add barrel files.
- TypeScript is strict in both packages and rejects unused locals/parameters. Do not use `any`; validate browser, network, and model data as `unknown`.

## CLI (`forge-cli`)
- Binary name is `forge-cli` (not `forge`) to avoid clashing with Laravel Forge CLI / Herd.
- Build/link: `pnpm --filter @forge/cli build`, then `cd apps/cli && pnpm link --global`, or run `pnpm --filter @forge/cli forge-cli -- <args>`.
- Config/session: `~/.forge/config.json` and `~/.forge/session.json` after `forge-cli init` and `forge-cli login`. Files must remain mode `0600`.
- Bookmarks CRUD talks to the same InsForge tables and RLS policies as web (`forge-cli bookmark create|list|get|update|delete`). Use `--json` for machine-readable output on create/list/get/update.
- Resources CRUD talks to the same InsForge `snippets` table and RLS policies as web `/resources` (`forge-cli resource create|list|get|update|delete`). Use `--json` on create/list/get/update.
- Dev Board projects: `forge-cli project create|list|get|update|delete` against the projects table. Delete is blocked if the project has tickets.
- Dev Board tickets: `forge-cli ticket create|list|get|update|delete|move` against the same tables as the web app. `create` and `list` require `--project-id`. Change column only via `move` (timer/events/time entries parity). Use `--json` on create/list/get/update/move.
- CLI unit tests must not call a real InsForge project.

## Routing And Tools
- Next.js App Router lives under `apps/web/src/app/`. Public auth screens use `(auth)` and protected screens use `(authenticated)`.
- Pages and layouts are Server Components by default. Add `"use client"` only at cohesive interactive boundaries; add `"use server"` only to Server Action modules.
- Adding a utility requires its feature, a thin App Router page, and an entry in `apps/web/src/lib/tools.ts`; that registry drives navigation and metadata.

## Next.js And Data
- Use Next.js 16 APIs. `cookies()`, `headers()`, `params`, and `searchParams` are async; use `proxy.ts`, not deprecated `middleware.ts`.
- Cache Components are enabled. Private changing data stays uncached behind Suspense; use `cacheTag`, `updateTag`, or `revalidateTag(tag, "max")` only with explicit cache semantics.
- Auth uses `@insforge/sdk/ssr`; refresh token stays HTTP-only. Mutations validate unknown input and re-check auth.
- TanStack Query remains only where client cache, optimistic updates, pagination, or polling justify it, notably Dev Board. Do not add it for server-rendered reads by default.
- `GROQ_API_KEY` is server-only and used by authenticated `/api/ai-content`.
- Theme tokens live in `apps/web/src/index.css`; shadcn configuration and aliases live in `apps/web/components.json`.

<!-- INSFORGE:START -->
## InsForge backend

This project uses [InsForge](https://insforge.dev): an all-in-one, open-source Postgres-based backend (BaaS) that gives this app a database, authentication, file storage, edge functions, realtime, an AI model gateway, and payments through one platform.

- **Project:** **Forge** (API base `https://w8x6am34.us-east.insforge.app`)
- **Skills:** these InsForge skills are installed for supported coding agents. Reach for them before implementing any InsForge feature instead of guessing the API:
  - `insforge`: app code with the `@insforge/sdk` client (database CRUD, auth, storage, edge functions, realtime, AI, email, and Stripe payments).
  - `insforge-cli`: backend and infrastructure via the `insforge` CLI (projects, SQL, migrations, RLS policies, storage buckets, functions, secrets, payment setup, schedules, deploys).
  - `insforge-debug`: diagnosing failures (SDK/HTTP errors, RLS denials, auth and OAuth issues) and running security or performance audits.
  - `insforge-integrations`: wiring external auth providers (Clerk, Auth0, WorkOS, Better Auth, etc.) for JWT-based RLS, or the OKX x402 payment facilitator.
  - `find-skills`: discovering additional skills on demand.
- **Credentials:** app code reads keys from `.env.local`; the CLI reads `.insforge/project.json`. Never hardcode or commit keys.

Key patterns:

- Database inserts take an array: `insert([{ ... }])`.
- Reference users with `auth.users(id)`; use `auth.uid()` in RLS policies.
- For storage uploads, persist both the returned `url` and `key`.
<!-- INSFORGE:END -->

# AGENTS.md

## Sources Of Truth

- This pnpm workspace has two tracked packages: Next.js app `apps/web` (`@forge/web`) and Node CLI `apps/cli` (`@codigoconelmer/forge-cli`). `packages/*` and `functions/*` are reserved globs; ignored `functions/ai-content-generator` artifacts are not a package.
- Root `README.md` still mentions Vite, Appwrite, and a missing `.env.example`; those claims are stale. Trust manifests, config, migrations, and current Next.js/InsForge source.
- Keep the product web-first. Do not add Tauri, Rust, native IPC, desktop-only dependencies, or speculative workspace packages.

## Commands

- Run workspace commands from the repository root: `pnpm install`, `pnpm dev`, `pnpm build`, `pnpm test`, `pnpm lint`, `pnpm format`, `pnpm doctor`.
- `pnpm build` and `pnpm test` cover web then CLI. Focus with `pnpm build:web`, `pnpm build:cli`, `pnpm test:web`, or `pnpm test:cli`; builds are the package typechecks (there is no separate root typecheck script).
- Run one web test with `pnpm --filter @forge/web exec vitest run <path>` and one CLI test with `pnpm --filter ./apps/cli exec vitest run <path>`; omit `run` for watch mode.
- Vitest uses globals and Node environment by default. Web tests receive test InsForge env values; DOM APIs require a per-test environment override.
- ESLint 9 uses root `eslint.config.mjs`; Prettier uses `.prettierrc`. The repository-wide Prettier check has an existing baseline, so format changed files and run `git diff --check` instead of rewriting unrelated files.
- `pnpm install` enforces a 24-hour package minimum age and no-downgrade trust policy from `pnpm-workspace.yaml`.

## Web Boundaries

- App Router lives in `apps/web/src/app`; `(auth)` is public and `(authenticated)` has the server-side user guard. `apps/web/src/proxy.ts` refreshes InsForge sessions and performs the early protected-path redirect. Do not create `middleware.ts`.
- Keep route files thin. Feature code owns components, hooks, services, schemas, types, tests, and utilities under `apps/web/src/features/<feature>/`; shared UI belongs in `src/components`, reusable infrastructure/pure helpers in `src/lib`, Route Handlers in `src/app/api`, and server-only feature code in `features/<feature>/server`.
- Adding a protected utility requires its feature, a thin `(authenticated)` page, an entry in `apps/web/src/lib/tools.ts`, and its path in `protectedPathPrefixes` plus proxy coverage.
- Import web source through `@/*` (`apps/web/src/*`) or direct relatives. Do not add barrel files. Both packages use strict TypeScript with unused checks; validate browser, network, and model data as `unknown`, not `any`.
- Theme tokens and Tailwind v4 imports live in `apps/web/src/index.css`; there is no Tailwind config. shadcn aliases/config live in `apps/web/components.json`, with generated primitives under `src/components/ui`.

## Next.js And Data

- Use Next.js 16 semantics: `cookies()`, `headers()`, `params`, and `searchParams` are async. Cache Components are enabled; keep private changing reads uncached behind Suspense and add cache tags only with explicit invalidation semantics.
- Pages/layouts are Server Components by default. Add `"use client"` only at cohesive interactive boundaries and `"use server"` only to Server Action modules. Keep secrets, provider calls, admin access, and remote page fetching server-only.
- Auth uses `@insforge/sdk/ssr`; refresh tokens remain HTTP-only. Mutations must validate untrusted input and re-check auth. TanStack Query is for justified client caching, optimistic updates, pagination, or polling (not default server reads).
- Database schema/RLS/RPC history lives in root `migrations/`. User-owned tables reference `auth.users(id)` and policies use `auth.uid()`. Dev Board lifecycle writes must use its RPCs so tickets, events, timers, and time entries remain atomic; validate snake_case rows before mapping to app/CLI types.
- InsForge inserts take arrays (`insert([{ ... }])`). Storage records must retain both returned `url` and `key`.
- Web env belongs in `apps/web/.env.local`: public InsForge URL/anon key plus feature-specific `GROQ_API_KEY`, `INSFORGE_API_KEY`, `CRON_TOKEN`, and `NEXT_PUBLIC_APP_URL`. Never expose server keys. Backend CLI credentials live in ignored `.insforge/project.json`; use the `insforge`, `insforge-cli`, or `insforge-debug` skill instead of guessing backend APIs or deploy commands.

## CLI And Releases

- Binary name is `forge-cli`, not `forge`. Build before direct execution: `pnpm build:cli`; run with `pnpm --filter ./apps/cli forge-cli -- <args>`. Detailed command contracts live in `apps/cli/README.md`.
- User config/session files are `~/.forge/config.json` and `~/.forge/session.json` and must remain mode `0600`. CLI tests must use mocked clients, never the live Forge project.
- Release tags must be `vX.Y.Z`, match `apps/cli/package.json`, and point to a commit already on `main`. Check with `pnpm check-cli-release-tag -- vX.Y.Z`; `.github/workflows/publish-cli.yml` builds/tests and publishes through npm Trusted Publishing.

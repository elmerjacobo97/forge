# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Full project conventions live in `AGENTS.md` — read it, it is authoritative. This file adds commands and architecture notes for working productively in the codebase.

## Commands

Run from the repo root (pnpm workspace, one app: `@forge/web` in `apps/web`).

- `pnpm install` — install all workspace dependencies
- `pnpm dev` — start the Next.js development server
- `pnpm build` — build Next.js and the CLI
- `pnpm test` — run the web and CLI test suites (Vitest) once
- `pnpm test:watch` — run both suites in watch mode (parallel)
- `pnpm test:coverage` — run both suites with V8 coverage
- `pnpm lint` / `pnpm lint:fix` — ESLint (flat config at repo root)
- `pnpm format` / `pnpm format:check` — Prettier (`.prettierrc`)
- `pnpm doctor` — run React Doctor against the web app

Single test file: `pnpm --filter @forge/web exec vitest run --config tests.config.ts <path>` (or omit `run` to watch). Web Vitest configuration lives in `apps/web/tests.config.ts`; CLI configuration lives in `apps/cli/vitest.config.ts`.

Linting uses ESLint + Prettier (not Biome). Config lives at the workspace root for the monorepo.

## Architecture

**Workspace**: pnpm workspace with `apps/web` (Next.js 16), `apps/cli` (`forge-cli`), and `apps/mcp` (remote Cloudflare Worker). They share InsForge backend data. `packages/forge-core` contains shared CLI/MCP services.

**Feature-first structure**: `apps/web/src/features/<feature>/` owns each feature's `components/`, `hooks/`, `services/`, `schemas/`, `types/`, `utils/`, and `actions.ts`. Active product features: `dev-board`, `ideas`, `resources`, `uptime-monitor`, `webhook-inspector`, and `auth`. Keep feature logic inside its feature folder unless it is genuinely shared.

**Tests**: web tests are colocated with the module they cover (`<module>.test.ts(x)`), with shared setup in `apps/web/src/test/setup.ts`. CLI tests live in `apps/cli/tests/` grouped by kind (`schemas/`, `services/`, `lib/`, `commands/`), with shared mocks in `apps/cli/tests/helpers/`.

**Routing**: Next.js App Router under `apps/web/src/app/`. `(auth)` holds login/register and `(authenticated)` performs the server-side session guard. Keep pages thin.

**Tool registry**: `apps/web/src/lib/tools.ts` drives sidebar and command palette. It lists Dev Board, Ideas, Resources, Uptime Monitor, and Webhook Inspector.

**Data**: InsForge Postgres schema is versioned in root `migrations/`. User-owned rows are protected with RLS. Dev Board transitions use RPC functions so tickets, events, and time entries update atomically.

**Auth**: `@insforge/sdk/ssr` owns cookies, Server Actions, browser refresh, server client, and `proxy.ts` session renewal.

**Aliasing**: `@/*` → `apps/web/src/*`.

**Styling**: Tailwind v4, theme tokens in `apps/web/src/index.css` (no separate `tailwind.config`). shadcn components in `apps/web/src/components/ui`, config in `apps/web/components.json`.

**Env**: `NEXT_PUBLIC_INSFORGE_URL` and `NEXT_PUBLIC_INSFORGE_ANON_KEY` are public. `INSFORGE_API_KEY` and `CRON_TOKEN` stay server-only for Uptime Monitor and Webhook Inspector.

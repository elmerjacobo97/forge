# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Full project conventions live in `AGENTS.md` — read it, it is authoritative. This file adds commands and architecture notes for working productively in the codebase.

## Commands

Run from the repo root (pnpm workspace, one app: `@forge/web` in `apps/web`).

- `pnpm install` — install all workspace dependencies
- `pnpm dev` — start the Next.js development server
- `pnpm build` — build Next.js and the CLI
- `pnpm test` — run the web test suite (Vitest) once
- `pnpm doctor` — run React Doctor against the web app

Single test file: `pnpm --filter @forge/web exec vitest run <path>` (or omit `run` to watch). Vitest configuration lives in `apps/web/vitest.config.ts`.

There is no lint script configured in either `package.json`; do not assume ESLint is present.

## Architecture

**Workspace**: pnpm workspace with `apps/web` (Next.js 16) and `apps/cli` (`forge-cli`). Both use the same InsForge backend. `packages/*` remains reserved; do not create packages speculatively.

**Feature-first structure**: `apps/web/src/features/<feature>/` owns everything for that feature — `components/`, `hooks/`, `services/`, `schemas/`, `types/`, `utils/`. There are ~25 features, mostly standalone dev-utility tools (JSON formatter, JWT decoder, hash generator, etc.) plus larger stateful features (`dev-board`, `bookmarks`, `snippets`, `auth`, `settings`). Keep feature logic inside its feature folder unless it's genuinely shared.

**Routing**: Next.js App Router under `apps/web/src/app/`. `(auth)` holds login/register and `(authenticated)` performs the server-side session guard. Keep pages thin.

**Tool registry**: `apps/web/src/lib/tools.ts` is the single source of truth for the tool catalog (id, route path, name, description, icon, category) that drives the home page and navigation. Adding a new dev-utility tool means: add a feature folder, add a route in `_authenticated/`, and register it in `tools.ts`.

**Data**: InsForge Postgres schema is versioned in root `migrations/`. User-owned rows are protected with RLS. Dev Board transitions use RPC functions so tickets, events, and time entries update atomically.

**Auth**: `@insforge/sdk/ssr` owns cookies, Server Actions, browser refresh, server client, and `proxy.ts` session renewal.

**Aliasing**: `@/*` → `apps/web/src/*`.

**Styling**: Tailwind v4, theme tokens in `apps/web/src/index.css` (no separate `tailwind.config`). shadcn components in `apps/web/src/components/ui`, config in `apps/web/components.json`.

**Env**: `NEXT_PUBLIC_INSFORGE_URL` and `NEXT_PUBLIC_INSFORGE_ANON_KEY` are public. `GROQ_API_KEY` is server-only.

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Full project conventions live in `AGENTS.md` — read it, it is authoritative. This file adds commands and architecture notes for working productively in the codebase.

## Commands

Run from the repo root. Command scope and single-file invocations live in `AGENTS.md`; root scripts live in `package.json`.

- `pnpm dev` — start the Next.js development server
- `pnpm dev:mcp` — start the MCP Worker locally
- `pnpm build` — build core, then web and the CLI
- `pnpm test` — run core, web, CLI, and MCP once
- `pnpm test:watch` — watch core, web, and CLI in parallel
- `pnpm test:coverage` — V8 coverage for core, web, and CLI
- `pnpm lint` / `pnpm lint:fix` — ESLint (flat config at repo root)
- `pnpm format` / `pnpm format:check` — Prettier (`.prettierrc`)
- `pnpm doctor` — run React Doctor against the web app

Linting uses ESLint + Prettier (not Biome). Config lives at the workspace root for the monorepo.

## Architecture

**Workspace**: pnpm workspace with `apps/web` (Next.js 16), `apps/cli` (`forge-cli`), and `apps/mcp` (remote Cloudflare Worker). They share InsForge backend data. `packages/forge-core` contains shared CLI/MCP services.

**Feature-first structure**: `apps/web/src/features/<feature>/` owns each feature's `components/`, `hooks/`, `services/`, `schemas/`, `types/`, `utils/`, and `actions.ts`. Active product features: `dev-board`, `ideas`, `resources`, `uptime-monitor`, `webhook-inspector`, and `auth`. Keep feature logic inside its feature folder unless it is genuinely shared.

**Tests**: web tests are colocated with the module they cover (`<module>.test.ts(x)`), with shared setup in `apps/web/src/test/setup.ts`. CLI-only tests live in `apps/cli/tests/lib/`. Schema and service tests live in `packages/forge-core/tests/`. MCP tests live in `apps/mcp/tests/`.

**Routing**: Next.js App Router under `apps/web/src/app/`. `(auth)` holds login/register and `(authenticated)` performs the server-side session guard. Keep pages thin.

**Tool registry**: `apps/web/src/lib/tools.ts` drives sidebar and command palette. It lists Dev Board, Ideas, Resources, Uptime Monitor, and Webhook Inspector.

**Data**: InsForge Postgres schema is versioned in root `migrations/`. User-owned rows are protected with RLS. Dev Board transitions use RPC functions so tickets, events, and time entries update atomically.

**Auth**: `@insforge/sdk/ssr` owns cookies, Server Actions, browser refresh, server client, and `proxy.ts` session renewal. `/login` also starts GitHub OAuth with InsForge PKCE; `/api/auth/callback` exchanges the code. Setup is `docs/github-oauth-setup.md`; GitHub secrets stay in InsForge.

**Aliasing**: `@/*` → `apps/web/src/*`.

**Styling**: Tailwind v4, theme tokens in `apps/web/src/index.css` (no separate `tailwind.config`). shadcn components in `apps/web/src/components/ui`, config in `apps/web/components.json`. Brand marks live in `apps/web/src/components/brand-icons/`.

**Env**: `NEXT_PUBLIC_INSFORGE_URL` and `NEXT_PUBLIC_INSFORGE_ANON_KEY` are public. `INSFORGE_API_KEY` and `CRON_TOKEN` stay server-only for Uptime Monitor and Webhook Inspector.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).

# Forge agent notes

## Boundaries

- `apps/web`: Next.js App Router; keep routes in `src/app` thin and feature logic in `src/features/<feature>`. `src/proxy.ts` refreshes sessions and redirects unauthenticated requests. Keep product web-first; avoid desktop-only dependencies.
- `packages/forge-core`: shared InsForge schemas and services for CLI and MCP. Keep it free of `node:*`; local config and session files belong in `apps/cli`. CLI entry is `apps/cli/src/main.ts`; `bookmark` aliases `resource`.
- `apps/mcp`: Cloudflare Worker with read **and ticket-write** tools. `src/index.ts` registers tools; OAuth and a persisted Forge refresh token guard access. See `apps/mcp/README.md` for operations. `pnpm build` does not build or deploy Worker.
- InsForge schema, RLS, and RPCs live in `migrations/`. Preserve atomic Dev Board transitions through RPCs; validate writes and re-check auth. Keep tests off live InsForge.

## Focused checks

- Root `pnpm build` builds core, web, then CLI; `pnpm test` runs core, web, CLI, then MCP. `pnpm test:watch` and `pnpm test:coverage` omit MCP. Worker typecheck: `pnpm --filter @forge/mcp typecheck`.
- Web single test: `pnpm --filter @forge/web exec vitest run --config tests.config.ts src/path/file.test.tsx`. Web tests are colocated; config sets Node environment, test InsForge env, globals, and `server-only` mock. DOM tests need `// @vitest-environment jsdom`.
- Core: `pnpm --filter @forge/core exec vitest run tests/<group>/<file>.test.ts`; CLI: `pnpm --filter ./apps/cli exec vitest run tests/lib/<file>.test.ts`; MCP: `pnpm --filter @forge/mcp exec vitest run tests/<file>.test.ts`. These tests import Vitest APIs explicitly; mock InsForge clients.
- Root ESLint and Prettier config cover workspace. Web Vitest config is `tests.config.ts`, not `vitest.config.ts`.

## Operations

- Local secrets: ignored `apps/web/.env.local`, `.insforge/project.json`, and `apps/mcp/.dev.vars`; MCP production secrets use Wrangler. Keep CLI files under `~/.forge` mode `0600`.
- CLI release workflow (`.github/workflows/publish-cli.yml`) triggers on `v*` tags; run `pnpm check-cli-release-tag -- vX.Y.Z`. Tag must match CLI package version and point to commit already on `main`.
- `graphify-out/graph.json` is generated and ignored. If present, query graph before browsing code; run `graphify update .` after code changes.

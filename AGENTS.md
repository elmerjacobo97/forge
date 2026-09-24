# Repository Guidelines

## Project Structure

- `apps/web` is the Next.js 16 application (`@forge/web`). Routes live in `src/app`; feature code belongs in `src/features/<feature>`, shared UI in `src/components`, and reusable infrastructure in `src/lib`. Active features: `auth`, `dev-board`, `ideas`, `resources`, `uptime-monitor`, and `webhook-inspector`.
- `apps/cli` is the Node/TypeScript CLI (`@codigoconelmer/forge-cli`, binary `forge-cli`). Source is under `src`, CLI-only tests under `tests/lib/`, the executable under `bin`, and release checks under `scripts`. `bookmark` remains an alias of `resource`.
- `packages/forge-core` is the private shared core (`@forge/core`): InsForge schemas, services, helpers, and types used by the CLI and the MCP Worker. Keep it free of `node:*` imports; config and session file access stay in `apps/cli`.
- `apps/mcp` is the read-only Cloudflare Worker (`@forge/mcp`) for the remote MCP endpoint. It consumes `@forge/core`. Local secrets live in `apps/mcp/.dev.vars`; production secrets are `wrangler secret` values. Setup steps are in `docs/mcp-remote-setup.md`.
- Database migrations are in `migrations/`; product docs are in `docs/` and feature specs in `specs/`.
- Keep the product web-first. Add no Tauri, Rust, native IPC, or desktop-only dependencies.

## Build, Test, and Development

Root scripts live in `package.json`. These are the ones that do not match their names:

- `pnpm build` builds core, then web, then the CLI. It does not deploy the Worker.
- `pnpm test` runs core, web, CLI, and MCP once.
- `pnpm test:watch` watches core, web, and CLI in parallel. MCP is excluded.
- `pnpm test:coverage` covers core, web, and CLI with V8. MCP has no coverage script.
- `pnpm dev:mcp` starts the Worker with wrangler.

Package scripts: `pnpm build:core`, `pnpm build:web`, `pnpm build:cli`, `pnpm test:core`, `pnpm test:web`, `pnpm test:cli`, and `pnpm test:mcp`.

Run one web test with `pnpm --filter @forge/web exec vitest run --config tests.config.ts <path>`. The web config is `apps/web/tests.config.ts`, so react-doctor does not misdetect Vite. Core, CLI, and MCP use `vitest.config.ts`. Run one core test with `pnpm --filter @forge/core exec vitest run tests/<group>/<file>.test.ts`, one CLI test with `pnpm --filter ./apps/cli exec vitest run tests/lib/<file>.test.ts`, and one MCP test with `pnpm --filter @forge/mcp exec vitest run tests/<file>.test.ts`. Coverage reports land in each covered package's `coverage/` directory. For CLI releases, run `pnpm check-cli-release-tag -- vX.Y.Z`.

## Code Style and Conventions

Use strict TypeScript, two-space indentation, semicolons, double quotes, and trailing commas; Prettier and ESLint enforce these rules. Import web code through `@/*`, avoid barrel files, and validate external data as `unknown`. Keep App Router files thin and feature logic together. Pages and layouts are Server Components by default; add client or server directives only at deliberate boundaries. Session refresh and protected redirects belong in `apps/web/src/proxy.ts`.

## Testing and Security

Vitest uses globals and the Node environment by default in the web app. Opt into a DOM environment per web test with `// @vitest-environment jsdom`. Name tests `*.test.ts` or `*.test.tsx`.

- **Web** (`apps/web`): colocate each test next to the module it covers. Shared setup lives in `src/test/setup.ts` (it mocks `server-only`) and is registered through `setupFiles` in `tests.config.ts`.
- **CLI** (`apps/cli`): tests cover config, session, flags, and format under `tests/lib/`. Import `describe`, `expect`, `it`, and `vi` explicitly; the CLI does not enable Vitest globals.
- **Core** (`packages/forge-core`): group tests under `tests/{schemas,services,lib}/`. Reusable InsForge client mocks live in `tests/helpers/`. Import `describe`, `expect`, `it`, and `vi` explicitly.
- **MCP** (`apps/mcp`): tests live under `tests/` with service mocks in `tests/helpers/`. Import `describe`, `expect`, `it`, and `vi` explicitly. `pnpm dev:mcp` covers runtime checks that Vitest cannot run.

Mock InsForge clients. Keep tests off the live Forge project. Secrets belong in ignored `apps/web/.env.local`, `.insforge/project.json`, or `apps/mcp/.dev.vars`. CLI config and session files under `~/.forge` must remain mode `0600`. Mutations must validate input, re-check auth, and preserve InsForge RLS and RPC invariants.

## Commits and Pull Requests

Follow the existing imperative prefixes such as `feat:`, `fix:`, `refactor:`, and `docs:`. PRs should explain the change, list validation commands, link related issues or specs, and include screenshots for UI changes. Release tags must be `vX.Y.Z`, match `apps/cli/package.json`, and point to a commit already on `main`.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

When the user types `/graphify`, use the installed graphify skill or instructions before doing anything else.

Rules:

- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- Dirty graphify-out/ files are expected after hooks or incremental updates; dirty graph files are not a reason to skip graphify. Only skip graphify if the task is about stale or incorrect graph output, or the user explicitly says not to use it.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).

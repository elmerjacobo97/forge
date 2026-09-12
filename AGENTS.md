# Repository Guidelines

## Project Structure

- `apps/web` is the Next.js 16 application (`@forge/web`). Routes live in `src/app`; feature code belongs in `src/features/<feature>`, shared UI in `src/components`, and reusable infrastructure in `src/lib`.
- `apps/cli` is the Node/TypeScript CLI (`@codigoconelmer/forge-cli`, binary `forge-cli`). Its source is under `src`, tests under `tests/`, executable entrypoint under `bin`, and release checks under `scripts`.
- `packages/forge-core` is the private shared core (`@forge/core`): InsForge schemas, services, helpers, and types consumed by the CLI. Keep it free of `node:*` imports; config/session file access stays in `apps/cli`.
- `apps/mcp` is the Cloudflare Worker (`@forge/mcp`) that serves the remote MCP endpoint; it consumes `@forge/core` and keeps secrets in `.dev.vars` locally and `wrangler secret` in production.
- Database migrations are in `migrations/`; supporting documentation and specifications are in `docs/` and `specs/`. Web tests are colocated with their feature modules; CLI tests live grouped under `apps/cli/tests/`.
- Keep the product web-first; do not add Tauri, Rust, native IPC, or desktop-only dependencies.

## Build, Test, and Development

```bash
pnpm install              # Install workspace dependencies
pnpm dev                  # Start the web app
pnpm build                # Build core, then web and CLI (also typechecks)
pnpm test                 # Run core, web and CLI Vitest suites
pnpm test:watch           # Run all suites in watch mode (parallel)
pnpm test:coverage        # Run all suites with V8 coverage reports
pnpm lint                 # Run ESLint
pnpm format               # Format files with Prettier
pnpm format:check         # Check Prettier formatting
pnpm doctor               # Run the web React Doctor check
```

Use `pnpm build:core`, `pnpm build:web`, `pnpm build:cli`, `pnpm test:core`, `pnpm test:web`, `pnpm test:cli`, or `pnpm test:mcp` to focus a package. Run one web test with `pnpm --filter @forge/web exec vitest run --config tests.config.ts <path>` (`tests.config.ts`, not `vitest.config.ts`, so react-doctor does not misdetect Vite); for the CLI and core, `pnpm --filter <pkg> exec vitest run tests/<group>/<file>.test.ts`. Coverage lives under each package's `coverage/` directory. For CLI releases, run `pnpm check-cli-release-tag -- vX.Y.Z`.

## Code Style and Conventions

Use strict TypeScript, two-space indentation, semicolons, double quotes, and trailing commas; Prettier and ESLint enforce these rules. Import web code through `@/*`, avoid barrel files, and validate external data as `unknown`, not `any`. Keep App Router files thin and feature logic together. Pages/layouts are Server Components by default; add client or server directives only at deliberate boundaries. Do not add `middleware.ts`; session refresh and protected redirects belong in `src/proxy.ts`.

## Testing and Security

Vitest uses globals and Node by default in the web app; opt into a DOM environment per web test with `// @vitest-environment jsdom`. Name tests `*.test.ts` or `*.test.tsx`.

- **Web** (`apps/web`): colocate each test next to the module it covers (`src/features/<feature>/utils/<module>.test.ts`). Shared setup lives in `src/test/setup.ts` (it mocks `server-only`) and is registered through `setupFiles` in `tests.config.ts`.
- **CLI** (`apps/cli`): CLI-only tests live under `apps/cli/tests/lib/` (config, session, flags, format). Import `describe`/`expect`/`it`/`vi` explicitly; the CLI does not enable Vitest globals.
- **Core** (`packages/forge-core`): group tests under `packages/forge-core/tests/{schemas,services,lib}/` and keep reusable InsForge client mocks in `packages/forge-core/tests/helpers/`. Import `describe`/`expect`/`it`/`vi` explicitly.
- **MCP** (`apps/mcp`): tests live under `apps/mcp/tests/` with shared service mocks and fixtures in `tests/helpers/`. Import `describe`/`expect`/`it`/`vi` explicitly; `wrangler dev` covers runtime checks that plain Vitest cannot run.

Mock CLI clients instead of using the live Forge project. Keep secrets in ignored `apps/web/.env.local` or `.insforge/project.json`; never expose server keys or commit credentials. CLI config/session files under `~/.forge` must remain mode `0600`. Mutations must validate input, re-check auth, and preserve InsForge RLS/RPC invariants.

## Commits and Pull Requests

Follow the existing imperative prefixes such as `feat:`, `fix:`, `refactor:`, and `docs:`. PRs should explain the change, list validation commands, link related issues/specs, and include screenshots for UI changes. Release tags must be `vX.Y.Z`, match `apps/cli/package.json`, and point to a commit already on `main`.

# Repository Guidelines

## Project Structure

- `apps/web` is the Next.js 16 application (`@forge/web`). Routes live in `src/app`; feature code belongs in `src/features/<feature>`, shared UI in `src/components`, and reusable infrastructure in `src/lib`.
- `apps/cli` is the Node/TypeScript CLI (`@codigoconelmer/forge-cli`, binary `forge-cli`). Its source is under `src`, executable entrypoint under `bin`, and release checks under `scripts`.
- Database migrations are in `migrations/`; supporting documentation and specifications are in `docs/` and `specs/`. Tests are colocated with the web features and CLI source.
- Keep the product web-first; do not add Tauri, Rust, native IPC, or desktop-only dependencies.

## Build, Test, and Development

```bash
pnpm install              # Install workspace dependencies
pnpm dev                  # Start the web app
pnpm build                # Build web, then CLI (also typechecks)
pnpm test                 # Run web and CLI Vitest suites
pnpm lint                 # Run ESLint
pnpm format               # Format files with Prettier
pnpm format:check         # Check Prettier formatting
pnpm doctor               # Run the web React Doctor check
```

Use `pnpm build:web`, `pnpm build:cli`, `pnpm test:web`, or `pnpm test:cli` to focus a package. Run one test with `pnpm --filter @forge/web exec vitest run <path>` or `pnpm --filter ./apps/cli exec vitest run <path>`. For CLI releases, run `pnpm check-cli-release-tag -- vX.Y.Z`.

## Code Style and Conventions

Use strict TypeScript, two-space indentation, semicolons, double quotes, and trailing commas; Prettier and ESLint enforce these rules. Import web code through `@/*`, avoid barrel files, and validate external data as `unknown`, not `any`. Keep App Router files thin and feature logic together. Pages/layouts are Server Components by default; add client or server directives only at deliberate boundaries. Do not add `middleware.ts`; session refresh and protected redirects belong in `src/proxy.ts`.

## Testing and Security

Vitest uses globals and Node by default; opt into a DOM environment per web test when needed. Name tests `*.test.ts` or `*.test.tsx`, and mock CLI clients instead of using the live Forge project. Keep secrets in ignored `apps/web/.env.local` or `.insforge/project.json`; never expose server keys or commit credentials. CLI config/session files under `~/.forge` must remain mode `0600`. Mutations must validate input, re-check auth, and preserve InsForge RLS/RPC invariants.

## Commits and Pull Requests

Follow the existing imperative prefixes such as `feat:`, `fix:`, `refactor:`, and `docs:`. PRs should explain the change, list validation commands, link related issues/specs, and include screenshots for UI changes. Release tags must be `vX.Y.Z`, match `apps/cli/package.json`, and point to a commit already on `main`.

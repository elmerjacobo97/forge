# AGENTS.md

## Project
Forge is a web-first workspace for developer utilities and team productivity. The current product is `apps/web`, a React application that will later grow workspaces, Dev Board collaboration, analytics, agent access, and optional desktop/mobile clients.

## Stack
- Frontend: React 19, TypeScript, Vite 7, Tailwind v4, shadcn, TanStack Router, TanStack Query, Appwrite.
- Package manager: pnpm workspaces.
- Runtime: browser only. Do not add Tauri, Rust, native IPC, or desktop-only dependencies to the web app.

## Commands
- `pnpm install` installs all workspace dependencies.
- `pnpm dev` starts `@forge/web`.
- `pnpm build` typechecks and builds `@forge/web`.
- `pnpm test` runs web tests.
- `pnpm doctor` runs React Doctor for the web app.

## Architecture
- Workspace root owns pnpm configuration and shared documentation.
- `apps/web/` is the deployable browser app.
- Web source lives in `apps/web/src/`.
- Features live in `apps/web/src/features/<feature>/` and own their components, hooks, services, schemas, and types.
- Shared UI belongs in `apps/web/src/components/`; reusable infrastructure and pure helpers belong in `apps/web/src/lib/`.
- Routes in `apps/web/src/routes/` are thin composition files. TanStack Router generates `apps/web/src/routeTree.gen.ts`; never edit that file manually.
- `@/*` resolves to `apps/web/src/*`.
- Future CLI, desktop, mobile, or shared packages are added only when they have real consumers. Do not create empty workspace packages.

## Conventions
- Import direct files. Do not add barrel files.
- Use strict TypeScript. Do not use `any`; validate untrusted input as `unknown` with Zod or explicit guards.
- Keep domain logic inside its feature unless it is genuinely shared.
- Browser capabilities only: use Web APIs and document CORS, permission, or browser-support constraints in the UI when relevant.
- Appwrite credentials remain in `apps/web/.env` and only public `VITE_*` configuration belongs there.
- Tailwind v4 theme tokens live in `apps/web/src/index.css`; shadcn config is `apps/web/components.json`.

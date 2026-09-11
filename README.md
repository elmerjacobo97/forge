# Forge

Forge es un workspace personal para desarrollo: utilidades de navegador, bookmarks, recursos, un Dev Board kanban con time tracking, uptime monitor y webhook inspector, con un CLI que opera sobre los mismos datos.

## Stack

- **Web:** Next.js 16 (App Router, Server Components, Server Actions) + React 19 + TypeScript estricto + Tailwind CSS 4 + shadcn/ui.
- **Backend:** InsForge (Postgres con RLS, auth, storage, realtime).
- **CLI:** `@codigoconelmer/forge-cli` (binario `forge-cli`) sobre el mismo proyecto InsForge.
- **Pensamiento:** browser-first, sin Tauri/Rust/native IPC.

## Estructura

```
apps/web        Next.js 16 — rutas en src/app, features en src/features
apps/cli        forge-cli — bookmarks, proyectos, tickets, recursos
migrations      Esquema InsForge (tablas, RLS, RPCs)
docs            Producto, roadmap e ideas
specs           Especificaciones por feature
```

Cada feature de `apps/web/src/features/<feature>` es dueña de sus `components/`, `hooks/`, `schemas/`, `services/`, `types/`, `utils/` y `actions.ts` (Server Actions). Las rutas en `src/app` son delgadas y solo componen features.

## Comandos

```bash
pnpm install      # Instalar dependencias
pnpm dev          # Web en desarrollo
pnpm build        # Build web + CLI (incluye typecheck)
pnpm test         # Tests web + CLI (Vitest)
pnpm lint         # ESLint
pnpm format       # Prettier
pnpm doctor       # React Doctor (web)
```

Para un solo test: `pnpm --filter @forge/web exec vitest run <ruta>`.

## Herramientas web

Productividad y datos: Dev Board, Bookmarks, Resources, JSON Formatter, JSON to TypeScript.
Red: HTTP Tester, Webhook Inspector, Uptime Monitor.
Utilidades: JWT Decoder, Regex Tester, Base64, Mock Data Generator, Password Generator, Image Tools.

## CLI

```bash
forge-cli init --from-web-env   # Configurar contra el proyecto InsForge
forge-cli login --email "<email>"
forge-cli bookmark list --json
forge-cli project list
forge-cli ticket list --project <id>
forge-cli resource list
```

La sesión y configuración viven en `~/.forge/` con permisos `0600`.

## Documentación

- `docs/product.md` — alcance y principios.
- `docs/ROADMAP.md` — estado actual y siguientes pasos.
- `docs/IDEAS.md` — ideas sin priorizar.
- `AGENTS.md` — guías para agentes y convenciones del repo.

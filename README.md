# Forge

Forge es un workspace personal de desarrollo: Dev Board, Ideas, Resources para enlaces de programación, Uptime Monitor y Webhook Inspector. Web, CLI y MCP comparten datos de InsForge.

## Stack

- **Web:** Next.js 16 (App Router, Server Components, Server Actions) + React 19 + TypeScript estricto + Tailwind CSS 4 + shadcn/ui.
- **Backend:** InsForge (Postgres con RLS, auth, storage, realtime).
- **CLI:** `@codigoconelmer/forge-cli` (binario `forge-cli`) sobre el mismo proyecto InsForge.
- **Pensamiento:** browser-first, sin Tauri/Rust/native IPC.

## Estructura

```
apps/web        Next.js 16 — rutas en src/app, features en src/features
apps/cli        forge-cli — recursos, ideas, proyectos y tickets
apps/mcp        MCP remoto — herramientas de Dev Board
migrations      Esquema InsForge (tablas, RLS, RPCs)
docs            Producto, roadmap e ideas
specs           Especificaciones por feature
```

Cada feature de `apps/web/src/features/<feature>` es dueña de sus `components/`, `hooks/`, `schemas/`, `services/`, `types/`, `utils/` y `actions.ts` (Server Actions). Las rutas en `src/app` son delgadas y solo componen features. Los tests web viven junto al módulo que cubren; los del CLI se agrupan en `apps/cli/tests/` por tipo (`schemas`, `services`, `lib`, `commands`).

## Comandos

```bash
pnpm install      # Instalar dependencias
pnpm dev          # Web en desarrollo
pnpm build        # Build core, web y CLI (incluye typecheck)
pnpm test         # Tests core, web, CLI y MCP (Vitest)
pnpm test:watch   # Tests core, web y CLI en modo watch
pnpm test:coverage # Tests core, web y CLI con cobertura V8
pnpm lint         # ESLint
pnpm format       # Prettier
pnpm doctor       # React Doctor (web)
```

Para un solo test web: `pnpm --filter @forge/web exec vitest run --config tests.config.ts <ruta>`. Para el CLI: `pnpm --filter ./apps/cli exec vitest run tests/<grupo>/<archivo>.test.ts`. Los reportes de cobertura quedan en `apps/web/coverage/` y `apps/cli/coverage/`.

## Herramientas web

Dev Board, Ideas, Resources, Webhook Inspector y Uptime Monitor.

## CLI

```bash
forge-cli init --from-web-env   # Configurar contra el proyecto InsForge
forge-cli login --email "<email>"
forge-cli resource list --json
forge-cli bookmark list --json  # alias compatible de resource
forge-cli project list
forge-cli ticket list --project <id>
forge-cli idea list
```

La sesión y configuración viven en `~/.forge/` con permisos `0600`.

## Documentación

- `docs/product.md` — alcance y principios.
- `docs/ROADMAP.md` — estado actual y siguientes pasos.
- `docs/IDEAS.md` — ideas sin priorizar.
- `AGENTS.md` — guías para agentes y convenciones del repo.

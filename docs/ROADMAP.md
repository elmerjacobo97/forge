# Roadmap — Forge

> Complementa `docs/product.md` (alcance) y `docs/IDEAS.md` (ideas sin priorizar). Forge es browser-first: `apps/cli` ya existe sobre la misma API InsForge y no hay plan de app nativa.

## Estado actual

- **Stack:** Next.js 16 (App Router, Server Components, Server Actions) + React 19 + InsForge (Postgres con RLS). Tailwind 4 + shadcn/ui.
- **Sin TanStack Query:** el server-state se maneja con lecturas en servidor, Server Actions para mutaciones y Route Handlers para polling/paginación de cliente.
- **Tools activas (5):** Dev Board, Ideas, Resources, Webhook Inspector y Uptime Monitor.
- **Limpieza actual:** se quitaron utilidades de navegador, AI generation y Settings. Bookmarks pasa a Resources; su migración conserva links y elimina filas del Resources anterior. Webhook Inspector y Uptime Monitor permanecen intactos.
- **Tests:** 525 tests con Vitest en core, web, CLI y MCP.

## Hecho en la última pasada

- Poda de herramientas y dependencias huérfanas.
- Resources ahora comparte una tabla y un contrato entre web y CLI; `bookmark` sigue como alias.
- Dev Board, Uptime Monitor, Webhook Inspector y MCP permanecen sin cambios funcionales.
- Filtros de listas en `searchParams` con islas de cliente mínimas.
- Un módulo por diálogo (`add`, `edit`, `delete`) en cada recurso.
- Route Handlers para: eventos de webhook, detalle de uptime, paginación de tickets y analítica del board.
- `loading.tsx` y `error.tsx` por grupo de rutas.
- Estados de página del dev board centralizados en `utils/board-state.ts` con tests.

## Pendientes y mejoras

### Alta prioridad

- **Dev Board:** undo de drag fallido con snapshot por columna (hoy revierte solo la columna afectada completa).

### Media

- **`use cache`:** aplicarlo solo si aparece data global cacheable (hoy todo lo server-side es por usuario).

### Baja

- **Accesibilidad:** corregir hallazgos de React Doctor en superficies activas.
- **Complejidad:** dividir `webhook-inspector.tsx`, `project-analytics.tsx` y `ticket-card.tsx` en subcomponentes con responsabilidades claras (React Doctor: control-flow complexity).
- **Duplicación JSX:** reducir duplicación de formularios y diálogos de borrado si React Doctor la detecta.
- **Formato:** revisar `pnpm format:check` después de la poda.

## Restricciones

| Tool              | Restricción  | Comportamiento                                |
| ----------------- | ------------ | --------------------------------------------- |
| Webhook Inspector | Polling      | Eventos vía Route Handler cada pocos segundos |
| Uptime Monitor    | Cron externo | InsForge programa los chequeos                |

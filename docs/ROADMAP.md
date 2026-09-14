# Roadmap — Forge

> Complementa `docs/product.md` (alcance) y `docs/IDEAS.md` (ideas sin priorizar). Forge es browser-first: `apps/cli` ya existe sobre la misma API InsForge y no hay plan de app nativa.

## Estado actual

- **Stack:** Next.js 16 (App Router, Server Components, Server Actions) + React 19 + InsForge (Postgres con RLS). Tailwind 4 + shadcn/ui.
- **Sin TanStack Query:** el server-state se maneja con lecturas en servidor, Server Actions para mutaciones y Route Handlers para polling/paginación de cliente.
- **Tools activas (15):** Dev Board, Ideas, Bookmarks, Resources, JSON Formatter, JSON to TypeScript, HTTP Tester, Webhook Inspector, Uptime Monitor, JWT Decoder, Regex Tester, Base64, Mock Data Generator, Password Generator, Image Tools.
- **Eliminado:** 12 utilidades triviales (html-entities, lorem-ipsum, url-encoder, text-manipulator, qr-generator, color-converter, uuid-generator, timestamp-converter, hash-generator, format-converter, diff-tool, file-validator), el residuo `supabase/`, la función Appwrite compilada en `functions/` y las carpetas vacías en `features/`.
- **Tests:** 277 tests con Vitest (utils puras, servicios con InsForge mockeado, schemas y handlers críticos).

## Hecho en la última pasada

- Poda de herramientas y dependencias huérfanas.
- Refactor server-first de bookmarks, resources, webhook inspector, uptime monitor y dev board.
- Filtros de listas (bookmarks, resources) en `searchParams` con islas de cliente mínimas.
- Un módulo por diálogo (`add`, `edit`, `delete`) en cada recurso.
- Route Handlers para: eventos de webhook, detalle de uptime, paginación de tickets y analítica del board.
- `loading.tsx` y `error.tsx` por grupo de rutas.
- Estados de página del dev board centralizados en `utils/board-state.ts` con tests.

## Pendientes y mejoras

### Alta prioridad

- **MCP server sobre `forge-cli`/API InsForge:** exponer bookmarks, proyectos, tickets y recursos a agentes de IA.
- **Búsqueda en server:** mover los filtros de bookmarks/resources a consultas SQL (`ilike`, `eq`) cuando el volumen lo justifique.
- **Dev Board:** undo de drag fallido con snapshot por columna (hoy revierte solo la columna afectada completa).

### Media

- **Image Tools:** romper el archivo monolítico en `components/`/`hooks/` y añadir resize/crop.
- **HTTP Tester:** colecciones guardadas y environments.
- **Mock Data Generator:** descripción en lenguaje natural aprovechando `/api/ai-content`.
- **`use cache`:** aplicarlo solo si aparece data global cacheable (hoy todo lo server-side es por usuario).

### Baja

- **Accesibilidad:** 11 botones solo-icono sin `aria-label` (base64, http-tester, image-tools, json-formatter, json-to-typescript, jwt-decoder, mock-data-generator, regex-tester) según React Doctor.
- **Complejidad:** dividir `webhook-inspector.tsx`, `project-analytics.tsx` y `ticket-card.tsx` en subcomponentes con responsabilidades claras (React Doctor: control-flow complexity).
- **Duplicación JSX:** unificar el formulario compartido de bookmark (add/edit) y extraer un diálogo de confirmación reutilizable para los tres `delete-*-dialog` (React Doctor: duplicated JSX subtree).
- **Formato:** el repo no pasa `pnpm format:check` (326 archivos previos a este refactor); decidir si se formatea todo en una pasada aparte.
- Cambio de tema por tool, atajos de teclado por herramienta.
- Env / `.env` manager vía File System Access API.
- Cron expression parser y SQL formatter (si se usan de verdad).

## Restricciones

| Tool                         | Restricción      | Comportamiento                                |
| ---------------------------- | ---------------- | --------------------------------------------- |
| file-validator / image-tools | Browser File API | Procesado local en el navegador               |
| http-tester                  | CORS             | Explica errores CORS; no los evita            |
| webhook-inspector            | Polling          | Eventos vía Route Handler cada pocos segundos |
| uptime-monitor               | Cron externo     | InsForge programa los chequeos                |

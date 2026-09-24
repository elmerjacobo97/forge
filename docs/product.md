# Forge

> Workspace personal para desarrollo, en una sola pestaña.

## Qué es

Forge es un workspace personal de desarrollo con Dev Board, Ideas y Resources para enlaces de programación. También conserva Uptime Monitor y Webhook Inspector. Web, CLI y MCP comparten datos de InsForge.

Hoy el objetivo no es ser un producto SaaS, sino la herramienta diaria del autor: rápida, privada y útil sin fricción.

## Principios

- **Simplicidad:** cada herramienta resuelve un problema concreto; si no se usa, se poda.
- **Server-first, cliente mínimo:** las vistas de datos se renderizan en el servidor; el estado de cliente queda en las islas interactivas (filtros en URL, arrastrar, diálogos).
- **Privacidad:** datos persistentes viven en el InsForge propio con RLS por usuario.
- **Browser-only:** sin Tauri, Rust ni IPC nativo. Si el navegador no puede, no entra.
- **Criterio antes que volumen:** pocas herramientas, bien hechas. Cada feature nueva debe ganarse su lugar.

## Qué incluye

### Superficies con datos

- **Dev Board:** kanban por proyecto con columnas fijas, drag & drop, time tracking automático en "In Progress", analítica (cycle time, tiempo registrado, throughput) y actualización en vivo vía InsForge realtime (los cambios del CLI se reflejan sin recargar).
- **Resources:** enlaces con categoría, tags y descripción. Web y CLI usan misma tabla `resources`.
- **Ideas:** captura de ideas con título, contenido, estado, categoría, tags y enlaces.
- **Webhook Inspector:** URLs temporales que capturan requests entrantes para inspección.
- **Uptime Monitor:** chequeos programados por HTTP con alertas a Telegram y Slack, latencia e historial.

### CLI (`forge-cli`)

CRUD de recursos, ideas, proyectos y tickets. `bookmark` queda como alias de `resource`.

### MCP remoto

Seis herramientas para consultar y operar Dev Board. MCP queda independiente de Resources.

## Arquitectura

- Next.js 16 con App Router. Las rutas (`src/app`) son delgadas y componen features; la lógica vive en `src/features/<feature>`.
- Lecturas: Server Components llaman a servicios server-only.
- Mutaciones: Server Actions con validación Zod y re-validación de sesión; `revalidatePath` donde la vista depende del servidor.
- Lecturas de cliente que lo requieren (polling de eventos webhook, detalle de uptime, paginación del board y analítica) pasan por Route Handlers autenticados.
- Los filtros de listas viven en la URL (`searchParams`), no en estado de cliente.

## Fuera de alcance

- Apps nativas o de escritorio.
- Multi-tenant o equipos (el modelo es un usuario por cuenta).
- Sustituir el navegador por integraciones a nivel de sistema operativo.

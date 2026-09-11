# Forge

> Workspace personal para desarrollo, en una sola pestaña.

## Qué es

Forge nació como colección de utilidades para desarrolladores y evolucionó a un workspace personal: además de las herramientas de cómputo puro (que corren 100% en el navegador), incluye superficies conectadas que guardan datos en una cuenta propia — bookmarks, recursos, un kanban con time tracking, uptime monitor y webhook inspector — más un CLI que opera sobre los mismos datos desde la terminal.

Hoy el objetivo no es ser un producto SaaS, sino la herramienta diaria del autor: rápida, privada y útil sin fricción.

## Principios

- **Simplicidad:** cada herramienta resuelve un problema concreto; si no se usa, se poda.
- **Server-first, cliente mínimo:** las vistas de datos se renderizan en el servidor; el estado de cliente queda en las islas interactivas (filtros en URL, arrastrar, diálogos).
- **Privacidad:** las herramientas de cómputo puro no envían datos a ningún servidor. Lo persistente vive en el InsForge propio con RLS por usuario.
- **Browser-only:** sin Tauri, Rust ni IPC nativo. Si el navegador no puede, no entra.
- **Criterio antes que volumen:** pocas herramientas, bien hechas. Cada feature nueva debe ganarse su lugar.

## Qué incluye

### Superficies con datos

- **Dev Board:** kanban por proyecto con columnas fijas, drag & drop, time tracking automático en "In Progress" y analítica (cycle time, tiempo registrado, throughput).
- **Bookmarks:** enlaces con categoría, tags, descripción y generación asistida por IA.
- **Resources:** notas, prompts, configuraciones y código con metadatos por herramienta.
- **Webhook Inspector:** URLs temporales que capturan requests entrantes para inspección.
- **Uptime Monitor:** chequeos programados por HTTP con alertas a Telegram y Slack, latencia e historial.

### Utilidades de navegador

JSON Formatter, JSON to TypeScript, JWT Decoder, Regex Tester, Base64, Mock Data Generator, Password Generator, Image Tools y HTTP Tester.

### CLI (`forge-cli`)

CRUD de bookmarks, proyectos, tickets y recursos sobre las mismas tablas InsForge, pensado para terminal y agentes.

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

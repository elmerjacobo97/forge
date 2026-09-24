# SPEC 23 — Escritura de tickets en el MCP

> **Estado:** Aprobado
> **Depende de:** SPEC 17 — Loop de agente sobre tickets · SPEC 18 — Servidor MCP remoto de Forge
> **Fecha:** 2026-09-24
> **Objetivo:** Añadir al MCP remoto tools para crear, mover, actualizar el handoff, comentar, pausar y reanudar tickets del Dev Board, reusando los RPC existentes y sin borrar.

## Alcance

**Incluye:**

- Seis tools nuevas en el MCP remoto de `apps/mcp`, misma sesión OAuth de GitHub y mismo cliente InsForge que las tools de lectura.
- `forge_create_ticket`: `projectId` y `title` obligatorios. `description` vacía, `column` `backlog` y `priority` `med` si no vienen. Comprueba que el proyecto existe, igual que el CLI, y llama a `create_dev_board_ticket`.
- `forge_move_ticket`: `ticketId` y `column` obligatorios. `branch`, `prUrl`, `clearBranch` y `clearPrUrl` opcionales, igual que `ticket move`. Llama a `move_dev_board_ticket`. El timer sigue en el RPC.
- `forge_update_ticket`: `ticketId` más al menos un campo de handoff (`branch`, `prUrl`, `clearBranch`, `clearPrUrl`). No acepta `title`, `description` ni `priority`. Llama a `update_dev_board_ticket` conservando título, descripción y prioridad actuales.
- `forge_add_ticket_comment`: `ticketId` y `body` (1 a 5000). Autor fijo `agent`. Inserta en `dev_board_ticket_comments`.
- `forge_pause_ticket` y `forge_resume_ticket`: solo `ticketId`. Llaman a `set_dev_board_ticket_timer` con `pause` o `resume`.
- Schemas en `apps/mcp/src/tool-schemas.ts`, handlers en `apps/mcp/src/tools.ts`, registro en `apps/mcp/src/index.ts`. Errores por `toToolError`.
- Tests en `apps/mcp/tests/tool-schemas.test.ts` y `apps/mcp/tests/tools.test.ts`.
- Documentar las seis tools en `apps/mcp/README.md`.

**Fuera de alcance (para specs futuras):**

- Borrar tickets, proyectos o comentarios.
- Editar `title`, `description` o `priority` desde el MCP.
- Ajustar tiempo (`adjust_dev_board_ticket_time`).
- Crear, editar o borrar proyectos. Filtrar por `status` de proyecto.
- Ideas, Resources, Uptime Monitor y Webhook Inspector.
- Cambios en `apps/web`, en el CLI y en migraciones SQL.
- Parámetro `author` y flag `confirm`.
- Prompts o resources de MCP.

## Modelo de datos

Esta spec no añade tablas, columnas ni RPC. Las escrituras pasan por `createDevBoardService`: `create`, `move`, `update`, `addComment`, `pauseTimer` y `resumeTimer`.

Entradas nuevas en `apps/mcp/src/tool-schemas.ts`:

```ts
type CreateTicketArgs = {
  projectId: string;
  title: string;
  description?: string; // default ""
  column?: ColumnId; // default "backlog"
  priority?: Priority; // default "med"
};

type MoveTicketArgs = {
  ticketId: string;
  column: ColumnId;
  branch?: string;
  prUrl?: string;
  clearBranch?: boolean;
  clearPrUrl?: boolean;
};

type UpdateTicketArgs = {
  ticketId: string;
  branch?: string;
  prUrl?: string;
  clearBranch?: boolean;
  clearPrUrl?: boolean;
};

type AddTicketCommentArgs = {
  ticketId: string;
  body: string;
};

type TicketIdArgs = {
  ticketId: string;
};
```

Reglas:

- `ColumnId` es `backlog | todo | in_progress | validation | review | done`. `Priority` es `low | med | high`.
- `title` va de 1 a 120. `description` hasta 2000. `branch` de 1 a 200. `prUrl` empieza por `http://` o `https://` y llega a 2048. `body` va de 1 a 5000. Mismos límites que `packages/forge-core/src/ticket-schema.ts`.
- `forge_update_ticket` exige al menos uno de `branch`, `prUrl`, `clearBranch` o `clearPrUrl`.
- `clearBranch` y `clearPrUrl` siguen el mapeo actual del servicio: cadena vacía hacia el RPC, que guarda `NULL`.
- `forge_add_ticket_comment` no recibe `author`. El handler pasa `agent`.
- `forge_create_ticket`, `forge_move_ticket`, `forge_update_ticket`, `forge_pause_ticket` y `forge_resume_ticket` devuelven el `Ticket` del servicio. `forge_add_ticket_comment` devuelve el `TicketComment` creado.

## Plan de implementación

### Grupo 1 — Schemas de entrada

- [x] 1.1 Añadir en `apps/mcp/src/tool-schemas.ts` los objetos Zod `createTicketInput`, `moveTicketInput`, `updateTicketInput`, `addTicketCommentInput` y `ticketIdInput`, con los límites y defaults del modelo.
- [x] 1.2 Cubrir en `apps/mcp/tests/tool-schemas.test.ts` el caso válido, los defaults de create (`description` `""`, `column` `backlog`, `priority` `med`), el rechazo de columna, prioridad, `prUrl` y `body` inválidos, y el update sin ningún campo de handoff.

### Grupo 2 — Handlers

- [x] 2.1 Extender `apps/mcp/tests/helpers/mock-services.ts` con `board.create`, `board.move`, `board.update`, `board.addComment`, `board.pauseTimer` y `board.resumeTimer`.
- [x] 2.2 Añadir en `apps/mcp/src/tools.ts` los handlers `createTicket`, `moveTicket`, `updateTicket`, `addTicketComment`, `pauseTicket` y `resumeTicket`. Create llama a `projects.get` y luego a `board.create`. Update reenvía solo handoff. Comment llama a `board.addComment(ticketId, body, "agent")`. Pause y resume llaman a `pauseTimer` y `resumeTimer`.
- [x] 2.3 Probar en `apps/mcp/tests/tools.test.ts` esas llamadas, el autor `agent` y que un error del servicio (`Project not found.`) se propaga.

### Grupo 3 — Registro y docs

- [x] 3.1 Registrar las seis tools en `apps/mcp/src/index.ts` con el mismo `run()` que las de lectura. Nombres: `forge_create_ticket`, `forge_move_ticket`, `forge_update_ticket`, `forge_add_ticket_comment`, `forge_pause_ticket`, `forge_resume_ticket`.
- [x] 3.2 Añadir las seis filas a la tabla de tools en `apps/mcp/README.md`, con argumentos y tipo de retorno.

## Criterios de aceptación

- [x] `forge_create_ticket` exige `projectId` y `title`. Sin `description`, `column` ni `priority` usa `""`, `backlog` y `med`. Llama a `projects.get` y luego a `create`.
- [x] `forge_move_ticket` exige `ticketId` y `column`. Pasa `branch`, `prUrl`, `clearBranch` y `clearPrUrl` cuando vienen. Llama a `move`.
- [x] `forge_update_ticket` rechaza una llamada sin `branch`, `prUrl`, `clearBranch` ni `clearPrUrl`. No acepta `title`, `description` ni `priority`. Llama a `update` solo con handoff.
- [x] `forge_add_ticket_comment` exige `ticketId` y `body` de 1 a 5000 caracteres. Llama a `addComment` con autor `agent`. No hay argumento `author`.
- [x] `forge_pause_ticket` llama a `pauseTimer`. `forge_resume_ticket` llama a `resumeTimer`. Ambas exigen solo `ticketId`.
- [x] Columna, prioridad, `prUrl` o `body` inválidos fallan en el schema y no llaman al servicio.
- [x] Un error del servicio, por ejemplo `Project not found.`, sale por `toToolError`. Ninguna tool pide `confirm`.
- [x] No existe tool de borrado, de ajuste de tiempo ni de edición de título, descripción o prioridad.
- [x] `apps/mcp/tests/tool-schemas.test.ts` y `apps/mcp/tests/tools.test.ts` cubren los casos de arriba. `pnpm test:mcp` pasa.
- [x] `apps/mcp/README.md` lista las seis tools con argumentos y tipo de retorno. `apps/web`, el CLI y `migrations/` no cambian.

## Decisiones

- **Sí:** Seis tools de escritura sobre el MCP de SPEC 18. Reusan `createDevBoardService` y los RPC de SPEC 17. Sin SQL nuevo.
- **Sí:** `forge_create_ticket` copia los defaults del CLI: `description` vacía, `column` `backlog`, `priority` `med`.
- **Sí:** `forge_move_ticket` acepta handoff opcional, igual que `ticket move`. El timer queda dentro de `move_dev_board_ticket`.
- **Sí:** `forge_update_ticket` solo cambia handoff (`branch`, `prUrl`, `clearBranch`, `clearPrUrl`).
- **No:** Editar `title`, `description` o `priority` desde el MCP. El agente no reescribe el ticket. Eso sigue en web y CLI.
- **Sí:** `forge_add_ticket_comment` fija el autor en `agent`. El MCP es superficie de agente.
- **No:** Parámetro `author`. Evita que un agente firme como `user`.
- **Sí:** Pausar y reanudar son tools propias. El agente puede parar el timer sin mover de columna.
- **No:** Flag `confirm`. La allowlist de GitHub ya limita quién llama. Una llamada escribe.
- **No:** Borrar tickets, ajustar tiempo, mutar proyectos, Ideas, Resources, web, CLI y migraciones. Cada uno, si llega, va en su spec.

## Riesgos

| Riesgo                                                                                                                                                                                        | Mitigación                                                                                        |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Un agente escribe sin segunda confirmación y puede crear o mover tickets de más.                                                                                                              | Sin `delete`. El comentario queda firmado `agent`. La allowlist de GitHub sigue siendo la puerta. |
| Mover a `in_progress` o `validation` arranca el timer dentro de `move_dev_board_ticket`.                                                                                                      | No reimplementar el timer en el MCP. Decirlo en la description de `forge_move_ticket`.            |
| `pause` o `resume` fuera de esas columnas, o con el timer en el estado contrario, lanza `Only in-progress or validation tickets have timers`, `Timer is not running` o `Timer is not paused`. | Dejar salir el error del RPC por `toToolError`. No traducirlo ni reintentar.                      |

## Qué **no** está en esta spec

- Borrar tickets, proyectos o comentarios.
- Editar `title`, `description` o `priority` desde el MCP.
- Ajustar tiempo con `adjust_dev_board_ticket_time`.
- Crear, editar o borrar proyectos. Filtrar proyectos por `status`.
- Ideas, Resources, Uptime Monitor y Webhook Inspector.
- Cambios en `apps/web`, en el CLI y en `migrations/`.
- Parámetro `author` y flag `confirm`.
- Prompts o resources de MCP.

Cada uno, si llega, va en su propia spec.

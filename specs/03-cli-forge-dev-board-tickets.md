# SPEC 03 — CLI Forge para tickets del Dev Board

> **Status:** Approved
> **Depends on:** SPEC 02
> **Date:** 2026-07-18
> **Objective:** Extender `forge-cli` con CRUD y `move` de tickets del Dev Board contra las mismas tablas Appwrite que la web, más skill para agentes.

## Alcance

**Incluye:**

- Extender `~/.forge/config.json` y `forge-cli init` / `--from-web-env` con las 3 tablas Dev Board: tickets, events y time entries (`VITE_APPWRITE_DEV_BOARD_*_TABLE_ID`).
- Subcomandos `forge-cli ticket create|list|get|update|delete|move` autenticados con la sesión existente de SPEC 02.
- Create: `--title` (obligatorio), `--description` (default `""`), `--priority` (`low|med|high`, default `med`), `--column` (default `backlog`).
- Update: solo `title`, `description`, `priority` (columna solo vía `move`).
- List: todos los tickets del usuario; filtro opcional `--column`.
- Move: cambia columna; coloca el ticket al final de la columna destino; misma semántica de timer/events/time entries que la web al entrar/salir de `in_progress`.
- Delete: solo la fila del ticket (sin cascade), como la web.
- Salida texto por defecto y `--json` en comandos de datos (`create|list|get|update|move`).
- Skill `forge-tickets` en `.claude/skills/` y `.agents/skills/`.
- Pruebas unitarias de validación/parsing (sin Appwrite real).
- Actualizar `apps/cli/README.md` y `AGENTS.md` con los comandos ticket.

**Fuera de alcance (specs futuras):**

- Pause/resume del timer desde el CLI.
- Lectura de analytics (events/time entries) desde el CLI.
- Reordenar con `--position` o drag-like reorder.
- Cascade delete de events/time entries.
- Cambios en `apps/web` o package compartido de tipos/utils.
- Snippets u otras features.
- Servidor MCP / publicación a npm / auth con API key.

## Modelo de datos

Reutiliza el modelo Dev Board de la web. No cambia el esquema Appwrite.

```ts
type ColumnId = "backlog" | "todo" | "in_progress" | "review" | "done";
type Priority = "low" | "med" | "high";

type Ticket = {
  id: string;
  title: string;
  description: string;
  column: ColumnId;
  position: number;
  priority: Priority;
  createdAt: string; // row.$createdAt
  timerStartedAt: string | null;
  totalElapsedMs: number;
  isPaused: boolean;
  lastMovedAt: string;
};
```

Fila Appwrite (tabla tickets): `userId`, `title`, `description`, `column`, `position`, `priority`, `totalElapsedMs`, `timerStartedAt`, `isPaused`, `lastMovedAt` + `$id` / `$createdAt`. Permisos por usuario, igual que la web.

Events y time entries (side-effects; el CLI no expone comandos de lectura):

```ts
type TicketEventRow = {
  userId: string;
  ticketId: string;
  eventType: "created" | "moved" | "started" | "completed" | "paused" | "resumed";
  fromColumn?: ColumnId;
  toColumn: ColumnId;
  occurredAt: string;
};

type TimeEntryRow = {
  userId: string;
  ticketId: string;
  startedAt: string;
  endedAt: string;
  durationMs: number;
};
```

Config extendida en `~/.forge/config.json`:

```ts
type ForgeConfig = {
  endpoint: string;
  projectId: string;
  databaseId: string;
  bookmarksTableId: string;
  // nuevos en esta spec:
  devBoardTicketsTableId: string;
  devBoardEventsTableId: string;
  devBoardTimeEntriesTableId: string;
};
```

Entradas de comandos:

```ts
type TicketCreateInput = {
  title: string; // 1–120
  description: string; // default ""; máx 2000
  priority: Priority; // default "med"
  column: ColumnId; // default "backlog"
};

type TicketUpdateInput = Partial<Pick<TicketCreateInput, "title" | "description" | "priority">>;

type TicketMoveInput = {
  id: string;
  column: ColumnId; // destino; posición = final de esa columna
};
```

Convenciones:

- Posición “al final” = misma regla que `moveTicket(..., append: true)` en la web (orden descendente por `position`).
- Create escribe event `created`. Move/update con cambio de columna escriben `moved` / `started` / `completed` según destino; salir de `in_progress` con timer activo escribe time entry (paridad con `devBoardService.updateTicket`).
- `--json` imprime `Ticket` (o array en `list`); sin flag, texto legible.
- Validación alineada a `ticketSchema` de la web + enums de columna/priority.

## Plan de implementación

1. Extender `ForgeConfig` en `apps/cli/src/types.ts` con `devBoardTicketsTableId`, `devBoardEventsTableId`, `devBoardTimeEntriesTableId`. Actualizar `config.ts`, `web-env.ts` e `init` para leer/escribir esas claves desde `VITE_APPWRITE_DEV_BOARD_*_TABLE_ID`. Comprobar: `forge-cli init --from-web-env` deja las 3 IDs en `~/.forge/config.json`.

2. Añadir tipos `Ticket` / `ColumnId` / `Priority` y schemas de validación (`ticket-schema.ts`) alineados a la web. Comprobar: tests unitarios de title/priority/column inválidos fallan; válidos pasan.

3. Implementar servicio CLI de Dev Board (`dev-board-service.ts` o equivalente) con list/get/create/update/delete/move contra Appwrite, incluyendo transacciones y side-effects de events/time entries como la web. Comprobar manualmente con cuenta de prueba: create → list → get → update → move (a `in_progress` y fuera) → delete.

4. Exponer `forge-cli ticket create|list|get|update|delete|move` en `commands/ticket.ts` y registrarlo en `main.ts`. Flags: `--title`, `--description`, `--priority`, `--column`, `--json`. Comprobar: `ticket --help` lista subcomandos; create inválido sale ≠ 0.

5. Formateo texto/`--json` para `Ticket` (y array en list). Comprobar: `list --json` parsea; sin flag es legible (id, title, column, priority, timer resumido).

6. Escribir skill `forge-tickets` en `.claude/skills/` y `.agents/skills/` con ejemplos create/list/move. Actualizar `apps/cli/README.md` y `AGENTS.md`. Comprobar: un agente con la skill encuentra el comando correcto.

7. Completar pruebas unitarias de parsing/validación/move helpers (sin red). Comprobar: `pnpm --filter @forge/cli test` y `pnpm build:cli` pasan.

## Criterios de aceptación

- [ ] `forge-cli init` / `--from-web-env` escribe en `~/.forge/config.json` las claves `devBoardTicketsTableId`, `devBoardEventsTableId` y `devBoardTimeEntriesTableId`.
- [ ] `forge-cli ticket --help` lista `create`, `list`, `get`, `update`, `delete`, `move`.
- [ ] Sin sesión, los comandos `ticket` fallan pidiendo login (código ≠ 0).
- [ ] `ticket create --title "…"` crea un ticket visible en el Dev Board web del mismo usuario (defaults: `description=""`, `priority=med`, `column=backlog`).
- [ ] `ticket create` con `--column in_progress` crea el ticket en esa columna y arranca el timer (event `started` o equivalente de create+move según implementación; resultado: `timerStartedAt` no nulo).
- [ ] `ticket list` lista solo tickets del usuario; `ticket list --column todo` filtra por columna.
- [ ] `ticket get <id>` muestra un ticket existente; id inexistente o de otro usuario falla de forma clara.
- [ ] `ticket update <id> --title "…"` / `--description` / `--priority` persiste el cambio; no cambia `column`.
- [ ] `ticket move <id> --column in_progress` mueve al final de la columna, inicia timer y escribe event; al mover fuera de `in_progress` detiene timer y crea time entry si había timer activo.
- [ ] `ticket delete <id>` elimina el ticket; deja de aparecer en `list` y en la web; no exige borrar events/time entries.
- [ ] Inputs inválidos (title vacío, priority desconocida, column inválida) rechazan el comando con mensaje no vacío y código ≠ 0.
- [ ] Con `--json`, `create|list|get|update|move` emiten JSON parseable; sin flag, texto legible.
- [ ] Existen skills `forge-tickets` en `.claude/skills/` y `.agents/skills/` con ejemplos de comandos.
- [ ] `pnpm --filter @forge/cli test` pasa sin red ni Appwrite; `pnpm build:cli` no se rompe.

## Decisiones

- **Sí:** Extender el CLI existente de SPEC 02 (`forge-cli`), no crear otro binario ni paquete.
- **No:** Nuevo package compartido web/CLI. Duplicar tipos/lógica mínima en `apps/cli` evita acoplar builds.
- **Sí:** Comando `forge-cli ticket …` (entidad clara).
- **No:** `board` / `dev-board` como verbo raíz en v1.
- **Sí:** CRUD + `move` con side-effects de timer/events/time entries como la web.
- **No:** Pause/resume ni analytics en esta spec.
- **Sí:** `update` solo `title` / `description` / `priority`; columna solo vía `move`.
- **No:** Cambiar columna con `update` (dos caminos confunden agentes).
- **Sí:** Create con `--column` opcional (default `backlog`) y `--priority` default `med`.
- **Sí:** Move al final de la columna destino (append), misma regla de `position` que la web.
- **No:** `--position` / reorder fino.
- **Sí:** Config con las 3 table IDs desde el inicio (move escribe events/time entries).
- **Sí:** Delete solo ticket, sin cascade (paridad web).
- **Sí:** Skill `forge-tickets` en `.claude/skills/` y `.agents/skills/`.
- **Sí:** `--json` opcional; texto por defecto.
- **No:** Cambios en `apps/web` en esta spec.

## Riesgos

| Riesgo                                                | Mitigación                                                                                                           |
| ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `~/.forge/config.json` existente sin IDs de Dev Board | `init`/`--from-web-env` rellena las 3 claves; comandos `ticket` fallan con mensaje claro si faltan.                  |
| Diverger de la semántica timer/events de la web       | Portar la lógica de `moveTicket` + `updateTicket` (events/time entries) y cubrir helpers con tests unitarios.        |
| Create con `--column in_progress` vs create+move      | Definir un solo camino en implementación (create en columna + aplicar startTimer/event) y verificarlo en aceptación. |
| Skills desactualizadas respecto a flags               | Escribir la skill en el mismo PR que los comandos; ejemplos copiados de `--help`.                                    |
| Transacciones Appwrite fallan a medias                | Usar el mismo patrón `createTransaction` / commit / rollback que `dev-board-service` web.                            |

## Qué **no** está en esta spec

- Pause/resume del timer desde el CLI.
- Lectura de analytics (events/time entries).
- Reordenar con `--position`.
- Cascade delete.
- Cambios en `apps/web` o package compartido.
- Snippets, MCP, npm, API key.

Cada uno de esos, si entra, va en su propia spec.

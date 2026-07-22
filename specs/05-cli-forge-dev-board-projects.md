# SPEC 05 — CLI Forge para proyectos del Dev Board

> **Status:** Implemented
> **Depends on:** SPEC 03, SPEC 04
> **Date:** 2026-07-19
> **Objective:** Extender `forge-cli` con CRUD de proyectos Dev Board y alinear `ticket create|list` con `projectId` obligatorio, más skill para agentes.

## Alcance

**Incluye:**

- Extender `~/.forge/config.json` y `forge-cli init` / `--from-web-env` con `devBoardProjectsTableId` (`VITE_APPWRITE_DEV_BOARD_PROJECTS_TABLE_ID`).
- Subcomandos `forge-cli project create|list|get|update|delete` autenticados con la sesión existente.
- Create: `--name` (obligatorio, 1–80), `--description` (default `""`, máx 2000).
- Update: `--name` y/o `--description`.
- List / get: proyectos del usuario autenticado.
- Delete: bloqueado si el proyecto tiene tickets (mensaje claro; sin cascade), misma regla que la web.
- Alinear tickets: `ticket create` exige `--project-id`; el CLI verifica que el proyecto exista y sea del usuario antes de crear.
- `ticket list` exige `--project-id` (filtra a ese proyecto); `--column` sigue opcional.
- `ticket get|update|move|delete` siguen por `ticketId` (sin cambio de semántica de timer/events).
- Salida texto por defecto y `--json` en comandos de datos de project y en create/list/get/update/move de ticket.
- Skill nuevo `forge-projects` en `.claude/skills/` y `.agents/skills/`; actualizar skill `forge-tickets` con `--project-id`.
- Tests unitarios de validación/parsing (sin Appwrite real).
- Actualizar `apps/cli/README.md` y `AGENTS.md`.

**Fuera de alcance (specs futuras):**

- Mover tickets entre proyectos.
- Cascade delete de tickets/events/time entries al borrar un proyecto.
- Pause/resume del timer, analytics, o reorder con `--position` desde el CLI.
- Cambios en `apps/web` o package compartido web/CLI.
- Color, archive, miembros, columnas custom por proyecto.
- Proyecto “default” / “Inbox” automático.
- Snippets u otras features; MCP; publicación a npm; auth con API key.

## Modelo de datos

Reutiliza el modelo de proyectos de SPEC 04 y el de tickets de SPEC 03 + `projectId`. No cambia el esquema Appwrite.

```ts
type Project = {
  id: string;
  name: string;
  description: string; // "" si vacío
  createdAt: string; // row.$createdAt
};

// Ticket = modelo SPEC 03 + projectId obligatorio
type Ticket = {
  id: string;
  projectId: string;
  title: string;
  description: string;
  column: ColumnId;
  position: number;
  priority: Priority;
  createdAt: string;
  timerStartedAt: string | null;
  totalElapsedMs: number;
  isPaused: boolean;
  lastMovedAt: string;
};
```

Config extendida en `~/.forge/config.json`:

```ts
type ForgeConfig = {
  endpoint: string;
  projectId: string; // Appwrite project
  databaseId: string;
  bookmarksTableId: string;
  devBoardTicketsTableId: string;
  devBoardEventsTableId: string;
  devBoardTimeEntriesTableId: string;
  // nuevo en esta spec:
  devBoardProjectsTableId: string;
};
```

Entradas de comandos:

```ts
type ProjectCreateInput = {
  name: string; // trim, 1–80
  description: string; // default ""; máx 2000
};

type ProjectUpdateInput = Partial<ProjectCreateInput>;

type TicketCreateInput = {
  projectId: string; // flag --project-id; debe existir y ser del usuario
  title: string; // 1–120
  description: string; // default ""; máx 2000
  priority: Priority; // default "med"
  column: ColumnId; // default "backlog"
};
```

Convenciones:

- Flag CLI: `--project-id` (kebab). En tipos/JSON del dominio: `projectId`.
- `ticket list` exige `--project-id`; `--column` opcional encima de ese filtro.
- Delete de proyecto: solo si `count(tickets where projectId)` es 0; si no, error claro sin borrar nada.
- `--json` imprime `Project` / `Ticket` (o array en `list`); sin flag, texto legible.
- Validación alineada a schemas de la web (`name` 1–80, `description` máx 2000; tickets como SPEC 03).

## Plan de implementación

1. Extender `ForgeConfig` en `apps/cli/src/types.ts` con `devBoardProjectsTableId`. Actualizar `config.ts`, `web-env.ts` e `init` para leer/escribir `VITE_APPWRITE_DEV_BOARD_PROJECTS_TABLE_ID`. Comprobar: `forge-cli init --from-web-env` deja la ID en `~/.forge/config.json`.

2. Añadir tipo `Project` y schema de validación (`project-schema.ts`: `name` 1–80, `description` máx 2000). Comprobar: tests unitarios de name/description inválidos fallan; válidos pasan.

3. Implementar servicio CLI de proyectos (`projects-service.ts` o equivalente) con list/get/create/update/delete contra Appwrite. Delete comprueba que no haya tickets del `projectId` antes de borrar. Comprobar manualmente: CRUD de un proyecto vacío; delete con tickets falla.

4. Exponer `forge-cli project create|list|get|update|delete` en `commands/project.ts` y registrarlo en `main.ts`. Flags: `--name`, `--description`, `--json`. Comprobar: `project --help` lista subcomandos; create inválido sale ≠ 0.

5. Formateo texto/`--json` para `Project` (y array en list). Comprobar: `list --json` parsea; sin flag es legible (id, name, description corta).

6. Alinear tickets: exigir `--project-id` en `ticket create` y `ticket list`; verificar que el proyecto exista y sea del usuario antes de create; filtrar list por `projectId` (+ `--column` opcional). Extender `Ticket` / create input / servicio con `projectId`. Comprobar: create sin flag falla; create con id inválido falla; list sin flag falla; list con id correcto solo muestra ese proyecto.

7. Escribir skill `forge-projects` en `.claude/skills/` y `.agents/skills/`. Actualizar `forge-tickets` con `--project-id`. Actualizar `apps/cli/README.md` y `AGENTS.md`. Comprobar: un agente con las skills encuentra create project → create ticket con el id.

8. Completar pruebas unitarias de parsing/validación (sin red). Comprobar: `pnpm --filter @forge/cli test` y `pnpm build:cli` pasan.

## Criterios de aceptación

- [ ] `forge-cli init` / `--from-web-env` escribe `devBoardProjectsTableId` en `~/.forge/config.json`.
- [ ] `forge-cli project --help` lista `create`, `list`, `get`, `update`, `delete`.
- [ ] Sin sesión, los comandos `project` y `ticket` fallan pidiendo login (código ≠ 0).
- [ ] `project create --name "…"` crea un proyecto visible en `/dev-board` web del mismo usuario (`description=""` por defecto).
- [ ] `project list` lista solo proyectos del usuario; `project get <id>` muestra uno existente; id inexistente o de otro usuario falla de forma clara.
- [ ] `project update <id> --name` / `--description` persiste el cambio.
- [ ] `project delete <id>` elimina un proyecto **sin** tickets; deja de aparecer en `list` y en la web.
- [ ] `project delete <id>` con tickets falla con mensaje claro; el proyecto y sus tickets siguen existiendo.
- [ ] `ticket create` sin `--project-id` falla (código ≠ 0, mensaje no vacío).
- [ ] `ticket create --project-id <id> --title "…"` escribe `projectId` correcto; el ticket aparece solo en ese board web.
- [ ] `ticket create` con `--project-id` inexistente o de otro usuario falla de forma clara (no crea ticket).
- [ ] `ticket list` sin `--project-id` falla; con `--project-id` lista solo tickets de ese proyecto; `--column` sigue filtrando encima.
- [ ] `ticket get|update|move|delete` siguen funcionando por `ticketId` con la semántica de timer/events de SPEC 03.
- [ ] Inputs inválidos de proyecto (`name` vacío/>80, `description` >2000) rechazan el comando con mensaje no vacío y código ≠ 0.
- [ ] Con `--json`, `project create|list|get|update` y `ticket create|list|get|update|move` emiten JSON parseable; sin flag, texto legible.
- [ ] Existen skills `forge-projects` y `forge-tickets` actualizado (con `--project-id`) en `.claude/skills/` y `.agents/skills/`.
- [ ] `pnpm --filter @forge/cli test` pasa sin red ni Appwrite; `pnpm build:cli` no se rompe.

## Decisiones

- **Sí:** Extender el CLI existente (`forge-cli`), no crear otro binario.
- **No:** Package compartido web/CLI. Duplicar tipos/lógica mínima en `apps/cli`.
- **Sí:** Comando raíz `forge-cli project …` (entidad clara, paralelo a `ticket` / `bookmark`).
- **No:** Anidar como `forge-cli board project …` en v1.
- **Sí:** CRUD completo de proyectos (`create|list|get|update|delete`).
- **No:** Solo `create` sin list/get — deja el flujo CLI a medias.
- **Sí:** Delete de proyecto bloqueado si tiene tickets (paridad web).
- **No:** Cascade delete de tickets/events/time entries.
- **Sí:** `ticket create` y `ticket list` exigen `--project-id`.
- **No:** Listar todos los tickets del usuario sin scope de proyecto.
- **Sí:** Verificar en CLI que el proyecto exista y sea del usuario antes de `ticket create`.
- **No:** Confiar solo en el fallo opaco de Appwrite.
- **Sí:** Flag kebab `--project-id`; campo de dominio `projectId`.
- **Sí:** Skill nuevo `forge-projects` + actualizar `forge-tickets`.
- **Sí:** `--json` opcional; texto por defecto.
- **No:** Analytics, pause/resume, mover tickets entre proyectos, proyecto default, cambios en `apps/web`.

## Riesgos

| Riesgo                                                              | Mitigación                                                                                                      |
| ------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Config `~/.forge` sin `devBoardProjectsTableId` tras upgrade        | `init` / `--from-web-env` lo exige; comandos `project` fallan con mensaje que pide re-init.                     |
| Agentes / scripts usan `ticket create` sin `--project-id` (SPEC 03) | Breaking change documentado; skill `forge-tickets` actualizado; error CLI claro si falta el flag.               |
| Delete de proyecto con race (ticket creado entre check y delete)    | Re-check de conteo justo antes del delete; preferir fallar el delete si el listado no está vacío (paridad web). |
| `ticket create` con `projectId` de otro usuario                     | Get del proyecto filtrado por sesión/`userId` antes de create; error claro si no existe o no es propio.         |

## Qué **no** está en esta spec

- Mover tickets entre proyectos.
- Cascade delete al borrar un proyecto.
- Pause/resume del timer, analytics o `--position` desde el CLI.
- Cambios en `apps/web` o package compartido web/CLI.
- Color, archive, miembros, columnas custom, proyecto default.
- Snippets, MCP, npm, auth con API key.

Cada uno de esos, si entra, va en su propia spec.

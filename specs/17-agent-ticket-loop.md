# SPEC 17 — Loop de agente sobre tickets

> **Estado:** Implementado
> **Depende de:** SPEC 03 — CLI Forge para tickets del Dev Board; SPEC 04 — Dev Board proyectos; SPEC 08 — Resources (patrón de tabla con RLS)
> **Fecha:** 2026-09-11
> **Objetivo:** Cerrar el loop de trabajo entre agentes de código y el Dev Board: un comando `ticket next` que entrega contexto accionable, comentarios de handoff en el ticket y `branch`/`pr_url` opcionales que el agente reporta al mover a `review`, todo operable desde `forge-cli` con salida JSON y errores parseables.

## Alcance

**Incluye:**

- Migración SQL: tabla `dev_board_ticket_comments`, columnas `branch` y `pr_url` en `dev_board_tickets`, y RPCs `update_dev_board_ticket` / `move_dev_board_ticket` extendidos para aceptar ambas.
- Comentarios de ticket append-only con autor `user | agent`.
- CLI `ticket next [--project-id] [--json]`: entrega el siguiente ticket pendiente con proyecto, comentarios y aviso de trabajo en progreso.
- CLI `ticket comment <id> --body --author` para crear y `ticket comments <id>` para listar.
- CLI `ticket update` y `ticket move` aceptan `--branch`, `--pr-url`, `--clear-branch`, `--clear-pr-url`.
- Errores JSON en todos los comandos del CLI: `{"error":{"message":"..."}}` en stderr con exit code 1 cuando `--json` está activo.
- `--json` en los subcomandos `delete` de bookmark, resource, project y ticket.
- Web: hilo de comentarios en un dialog propio `Comments` abierto desde el menú de la tarjeta, campos `branch`/`pr_url` en modo edición y badge de contador de comentarios en la tarjeta.
- Route Handler `GET /api/dev-board/tickets/[ticketId]/comments` y Server Action para crear comentarios con autor `user`.
- Actualizar `.agents/skills/forge-tickets/SKILL.md` con el loop y `apps/cli/README.md` con los comandos nuevos.
- Tests web y CLI de schemas, servicios y formatos nuevos.

**Fuera de alcance:**

- Docs/wiki por proyecto (capa 2 del roadmap; spec futura).
- Servidor MCP sobre `forge-cli` o la API InsForge.
- Realtime, polling o refresco remoto de comentarios; se cargan al abrir el dialog.
- Notificaciones o triggers de base de datos al mover a `review`.
- Analítica de review (cycle time de review a done) y nuevos tipos de evento.
- Markdown en comentarios; texto plano con saltos de línea.
- Edición o borrado de comentarios; son append-only.
- Paginación de comentarios.
- `--body-file` o lectura de stdin para comentarios largos.
- Flag `--column` en `ticket next`; el backlog se consulta con `ticket list --column backlog`.
- `branch`/`pr_url` en el formulario de creación y en la tarjeta del board.
- Cambios a componentes bajo `apps/web/src/components/ui`.

## Data model

Migración nueva `migrations/20260911120000_agent-ticket-loop.sql`, mismo estilo snake_case + RLS que el esquema inicial.

Columnas nuevas en `public.dev_board_tickets`:

```sql
ALTER TABLE public.dev_board_tickets
  ADD COLUMN branch TEXT CHECK (branch IS NULL OR char_length(branch) BETWEEN 1 AND 200),
  ADD COLUMN pr_url TEXT CHECK (
    pr_url IS NULL OR (char_length(pr_url) <= 2048 AND pr_url ~* '^https?://')
  );
```

Tabla de comentarios:

```sql
CREATE TABLE IF NOT EXISTS public.dev_board_ticket_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  ticket_id UUID NOT NULL REFERENCES public.dev_board_tickets(id) ON DELETE CASCADE,
  body TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 5000),
  author TEXT NOT NULL DEFAULT 'user' CHECK (author IN ('user', 'agent')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS dev_board_ticket_comments_ticket_created_idx
  ON public.dev_board_ticket_comments (ticket_id, created_at);
```

Reglas:

- RLS habilitado con las cuatro políticas own (`select`, `insert`, `update`, `delete`) y trigger `prevent_user_id_change`, replicando el patrón de `resources` (`migrations/20260721120000_replace-snippets-with-resources.sql:32-50`).
- `GRANT SELECT, INSERT, UPDATE, DELETE ON public.dev_board_ticket_comments TO authenticated`.
- Sin columna `updated_at`: la tabla es append-only; update/delete quedan a nivel de grants/RLS para simetría con el resto, pero ninguna superficie los expone en esta spec.
- Inserción desde CLI y web directa por SDK (`.insert(...).select(...).single()`), sin RPC: no hay lógica atómica que proteger.
- Borrar un ticket elimina sus comentarios por `ON DELETE CASCADE`.

RPCs extendidos (drop + recreate por cambio de firma; los defaults mantienen resolviendo las llamadas actuales de 2 y 4 argumentos):

```sql
DROP FUNCTION IF EXISTS public.update_dev_board_ticket(UUID, TEXT, TEXT, TEXT);
CREATE FUNCTION public.update_dev_board_ticket(
  p_ticket_id UUID,
  p_title TEXT,
  p_description TEXT,
  p_priority TEXT,
  p_branch TEXT DEFAULT NULL,
  p_pr_url TEXT DEFAULT NULL
) RETURNS public.dev_board_tickets ...;

DROP FUNCTION IF EXISTS public.move_dev_board_ticket(UUID, TEXT);
CREATE FUNCTION public.move_dev_board_ticket(
  p_ticket_id UUID,
  p_column_id TEXT,
  p_branch TEXT DEFAULT NULL,
  p_pr_url TEXT DEFAULT NULL
) RETURNS public.dev_board_tickets ...;
```

Reglas de `branch`/`pr_url` en ambos RPCs:

- `NULL` = no cambiar el valor actual.
- `''` = limpiar (se guarda `NULLIF(p_branch, '')`).
- Cualquier otro valor = asignar, sujeto a los CHECK de la tabla.
- El resto de la lógica de `move_dev_board_ticket` (posición, timer, time entries, eventos) queda intacta.

Tipos CLI (`apps/cli/src/types.ts`):

```ts
export type CommentAuthor = "user" | "agent";

export interface TicketComment {
  id: string;
  ticketId: string;
  author: CommentAuthor;
  body: string;
  createdAt: string;
}

export interface NextTicketContext {
  ticket: Ticket | null;
  project: { id: string; name: string } | null;
  comments: TicketComment[];
  inProgress: Array<{
    ticket: Ticket;
    project: { id: string; name: string } | null;
  }>;
}
```

Reglas:

- `Ticket` añade `branch: string | null` y `prUrl: string | null`.
- `TicketUpdateInput` y el input de `move` aceptan `branch?`, `prUrl?` y los booleanos de limpieza.
- `NextTicketContext.inProgress` se filtra por proyecto cuando se pasa `--project-id`; sin flag lista todo el usuario.

Tipos web (`apps/web/src/features/dev-board/types/board.ts`):

```ts
export interface TicketComment {
  id: string;
  ticketId: string;
  author: "user" | "agent";
  body: string;
  createdAt: string;
}

export interface Ticket {
  // campos actuales +
  branch: string | null;
  prUrl: string | null;
  commentCount?: number;
}
```

Reglas:

- `commentCount` es opcional: solo lo adjunta `fetchTicketPage`; las respuestas de RPC no lo traen.
- `upsertTicket` y helpers de `board-state.ts` preservan el `commentCount` del ticket existente cuando el ticket entrante lo omite, para que un move o edit optimista no borre el badge.
- El contador se obtiene con una query extra por página: `.from("dev_board_ticket_comments").select("ticket_id").in("ticket_id", ids)` y tally en memoria.

## Plan de implementación

1. Crear `migrations/20260911120000_agent-ticket-loop.sql` con las columnas, la tabla de comentarios, RLS/grants y los dos RPCs extendidos con su semántica `NULL`/`''`. Pedir al usuario aplicarla con InsForge CLI antes de la verificación manual; ningún paso posterior depende de la migración para correr tests.
2. CLI: añadir `branch`/`prUrl` a `Ticket` y los tipos `TicketComment`/`NextTicketContext`/`CommentAuthor` en `types.ts`. Actualizar `dev-board-service.ts`: columnas del select, mapeo, `update` y `move` con los nuevos parámetros, `listComments`, `addComment` (con `get` previo para error "Ticket not found.") y `next({ projectId? })`.
3. CLI `next`: candidatos `todo` globales o filtrados por proyecto, orden por prioridad `high → med → low` y empate por `position desc`; resolver nombres de proyecto con una sola lectura de `dev_board_projects`; incluir comentarios del ticket elegido y la lista `inProgress`. Sin pendientes: retorno `{ ticket: null, project: null, comments: [], inProgress: [...] }`.
4. CLI schemas: extender `ticket-schema.ts` con `branch` (1–200), `prUrl` (http/https, ≤2048), flags de limpieza y schema de comentario (`--body` 1–5000, `--author user|agent` default `user`). Tests de parsing para cada caso.
5. CLI salida y errores: `format.ts` gana `writeErrorOutput(message, json)` con forma `{"error":{"message":"..."}}` a stderr; `formatComment*`, `formatNextContext*`, branch/PR en el texto de ticket y salida JSON de delete `{"deleted":true,"id":"..."}`. Cambiar `fail(message)` a `fail(message, json)` en los cuatro comandos y hacer que el catch de `main.ts` detecte `--json` en `process.argv`. Aplicarlo a bookmark, resource, project y ticket.
6. CLI comandos: registrar `ticket next`, `ticket comment`, `ticket comments`; añadir `--branch`/`--pr-url`/`--clear-branch`/`--clear-pr-url` a `ticket update` y `ticket move`; `--json` en `ticket delete` y en los otros delete. Actualizar textos de ayuda. Tests de servicios y formatos.
7. Actualizar `.agents/skills/forge-tickets/SKILL.md` con el loop (next → implementar → comment → move review con branch/PR) y `apps/cli/README.md` con la tabla de comandos, flags y errores JSON.
8. Web schemas y tipos: `ticketInputSchema` acepta `branch`/`prUrl` nullable; nuevo `ticketCommentSchema` (`body` 1–5000); `Ticket` con los campos nuevos y `commentCount` opcional.
9. Web servicio: `TICKET_COLUMNS` ampliado, `toTicket` mapea branch/PR, `fetchTicketPage` adjunta `commentCount`, y nuevos `listComments(ticketId)` / `createComment(ticketId, body)` con autor `user`. `updateTicket` pasa `p_branch`/`p_pr_url` (la web edita el valor completo o lo limpia con `''`).
10. Web surface: Route Handler `GET /api/dev-board/tickets/[ticketId]/comments` (auth re-check, 401/404/500), Server Action `createTicketCommentAction` con Zod + re-check de usuario, hook `use-ticket-comments.ts` siguiendo el patrón de `use-webhook-events.ts`, componente `ticket-comments.tsx` dentro de un dialog `Comments` propio (`ticket-comments-dialog.tsx`) abierto desde el menú de `ticket-card.tsx`, campos branch/PR en modo edición de `ticket-form.tsx` (sin el hilo de comentarios) y badge de contador en la tarjeta. Preservar `commentCount` en `upsertTicket` (y helper `incrementCommentCount` para el alta en vivo).
11. Tests: CLI (schemas, servicios: ranking de `next`, comentarios, move con handoff, semántica `NULL`/`''`, formato de errores JSON) y web (schemas, servicios: counts, listComments/createComment, acción). Reutilizar `apps/cli/tests/helpers/insforge-client.ts` y los mocks web existentes.
12. Ejecutar `pnpm test:web`, `pnpm test:cli`, `pnpm build:web`, `pnpm build:cli`, `pnpm lint` y Prettier solo sobre archivos tocados.

## Criterios de aceptación

**Migración:**

- [ ] `dev_board_tickets` tiene `branch` y `pr_url` nullable con sus CHECK de longitud y formato.
- [ ] `dev_board_ticket_comments` existe con FK CASCADE al ticket, autor restringido y RLS con las cuatro políticas own.
- [ ] Los comentarios de un usuario no son visibles para otro; `user_id` no se puede modificar.
- [ ] Borrar un ticket elimina sus comentarios.
- [ ] `update_dev_board_ticket` con 4 argumentos sigue funcionando (defaults) y no altera `branch`/`pr_url`.
- [ ] `update_dev_board_ticket` con `p_branch = ''` limpia la columna; con text la asigna.
- [ ] `move_dev_board_ticket` con 2 argumentos sigue funcionando; con `p_branch`/`p_pr_url` mueve y asigna en una sola llamada.
- [ ] La lógica de timer, time entries y eventos de `move` no cambia.

**CLI:**

- [ ] `forge-cli ticket next` sin `--project-id` devuelve el mejor `todo` de todos los proyectos, con `project`, `comments` e `inProgress`.
- [ ] `forge-cli ticket next --project-id X` limita candidatos e `inProgress` a ese proyecto.
- [ ] El orden es prioridad `high → med → low` y empate por `position desc` (arriba del tablero primero).
- [ ] Sin tickets `todo`: exit code 0, `--json` devuelve `ticket: null` y el texto indica que no hay pendientes.
- [ ] Con tickets en `in_progress`, `next` los incluye en `inProgress` y el texto advierte cuántos hay; no los elige como candidato.
- [ ] `ticket comment <id> --body "..."` crea el comentario con `author: "user"`; `--author agent` lo marca como agente.
- [ ] `ticket comments <id> [--json]` los lista en orden `created_at asc`.
- [ ] `ticket comment` sobre ticket inexistente falla con exit 1 y mensaje claro.
- [ ] `ticket move <id> --column review --branch b --pr-url https://...` mueve y guarda handoff en una llamada.
- [ ] `ticket update --clear-branch` y `--clear-pr-url` limpian los campos; `--branch ""` no es necesario.
- [ ] `pr_url` inválido (no http/https, >2048) falla con exit 1.
- [ ] Con `--json`, cualquier error emite `{"error":{"message":"..."}}` en stderr y exit 1; stdout queda limpio.
- [ ] Los cuatro `delete` aceptan `--json` y devuelven `{"deleted":true,"id":"..."}`.
- [ ] Los comandos existentes sin `--json` conservan su salida de texto actual.
- [ ] Los cambios de salida no rompen el formato de `bookmark`, `resource`, `project` ni los casos actuales de `ticket`.

**Web:**

- [ ] El menú de la tarjeta abre un dialog `Comments` con el hilo en orden ascendente y badge "agent" o "you".
- [ ] Se puede crear un comentario desde el dialog `Comments`; aparece sin recargar la página y con autor `user`.
- [ ] El dialog de edición muestra `branch` y `pr_url` con link clickable del PR; el formulario de creación no los muestra.
- [ ] Editar un ticket que tenía `branch`/`pr_url` y guardar sin tocarlos no los borra.
- [ ] La tarjeta muestra el badge de comentarios cuando `commentCount > 0`.
- [ ] Un move o edit optimista no resetea el `commentCount` visible; crear un comentario lo incrementa en vivo.
- [ ] El Route Handler responde 401 sin sesión y 404 con ticket inexistente.
- [ ] Sin comentarios, el hilo solo muestra el textarea y el badge no aparece.

**Skills y docs:**

- [ ] `forge-tickets` documenta el loop con ejemplos de `next`, `comment` y `move` con handoff.
- [ ] El README del CLI lista los comandos, flags nuevos y la forma del error JSON.

**General:**

- [ ] No se modifica ningún archivo bajo `apps/web/src/components/ui`.
- [ ] No se toca el esquema de otras tablas fuera de `dev_board_tickets` y la tabla nueva.
- [ ] `pnpm test:web` y `pnpm test:cli` pasan.
- [ ] `pnpm build:web` y `pnpm build:cli` terminan correctamente.
- [ ] `pnpm lint` pasa y los archivos tocados están formateados.

## Decisiones

- **Sí:** `ticket next` global por defecto con `--project-id` opcional; el flujo real es "¿qué tengo pendiente?", no "¿qué tiene pendiente un proyecto?".
- **Sí:** candidatos solo de `todo`; el backlog es una bandeja de ideas, no trabajo comprometido.
- **Sí:** `next` es solo lectura; la skill mueve a `in_progress` cuando decide trabajar. Sin efectos secundarios inesperados.
- **Sí:** ranking por prioridad y desempate `position desc`; la prioridad ya existe en el modelo y el empate respeta el orden visual del tablero.
- **Sí:** `next` expone `inProgress` como aviso sin imponer política; un ticket colgado no se esconde ni bloquea el siguiente pendiente.
- **Sí:** `next --json` devuelve el compuesto `{ticket, project, comments, inProgress}`; una sola llamada da todo el contexto de arranque.
- **Sí:** comentarios append-only con autor `user | agent`, texto plano, 1–5000, sin paginar; información de handoff, no un chat.
- **Sí:** `--author` explícito con default `user`; la skill pasa `--author agent`. Sin autodetección de TTY.
- **Sí:** handoff blando: la skill instruye comentar antes de mover, la base de datos no lo exige; los moves manuales desde web seguirían funcionando.
- **Sí:** `branch`/`pr_url` como columnas nullable del ticket; consultables y visibles sin parsear texto.
- **Sí:** `NULL` = no cambio y `''` = limpiar en los RPCs; permite mantener compatibilidad con llamadas viejas y limpiar con flags dedicados.
- **Sí:** `move` acepta `branch`/`pr_url`: handoff atómico en una llamada, sin ventana inconsistente entre update y move.
- **Sí:** errores JSON en todos los comandos con `--json` y `--json` en deletes; interfaz de máquina consistente para agentes.
- **Sí:** UI web incluida en esta spec: hilo de comentarios en un dialog `Comments` desde el menú de la tarjeta, campos branch/PR en el dialog de edición y badge en la tarjeta; el loop de review necesita superficie humana.
- **Sí:** branch/PR en tarjeta solo como mejora futura; el dialog es suficiente v1.
- **Sí:** skill existente `forge-tickets` actualizada en lugar de una skill nueva; una sola fuente para el CLI de tickets.
- **No:** MCP en esta spec; CLI + skills cubre el flujo y MCP queda para cuando duela.
- **No:** docs/wiki por proyecto; es la capa 2 y merece spec propia.
- **No:** markdown, edición, borrado ni paginación de comentarios.
- **No:** `--body-file`/stdin; heredoc de shell cubre los casos multilínea.

## Riesgos

| Riesgo                                                                  | Mitigación                                                                                                                      |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| El drop/recreate de los RPCs rompe llamadas existentes de web o CLI     | Defaults en los parámetros nuevos: las firmas de 2 y 4 argumentos siguen resolviendo. Cubrirlo en la verificación manual.       |
| El drop/recreate deja la función ausente si la migración falla a medias | Aplicar la migración como una unidad con InsForge CLI; verificar con una llamada de prueba tras aplicar.                        |
| Confusión `NULL` vs `''` en update/move                                 | Semántica documentada y cubierta con tests: `NULL` no cambia, `''` limpia, texto asigna.                                        |
| `commentCount` se pierde con moves/edits optimistas                     | `upsertTicket` preserva el contador previo cuando el ticket entrante lo omite; cubierto con test de `board-state`.              |
| Query extra de counts por página encarece el board                      | Una sola query `.in()` por página con ids de la página; volumen personal, aceptado.                                             |
| Fetch de comentarios dentro de un dialog es un patrón nuevo en el repo  | Seguir el patrón ya existente de `use-webhook-events.ts` + Route Handler autenticado; estado de error visible en el hilo.       |
| Comentario creado desde web con autor incorrecto                        | El Route Handler/Action fuerza `author: "user"`; el schema no acepta autor desde el cliente web.                                |
| Regex de `pr_url` laxa (`^https?://`) deja pasar URLs malformadas       | Validación suficiente para un dato de referencia; la URL final se abre en el navegador y el CHECK limita longitud/formato base. |
| `next` global consulta todos los proyectos y puede crecer               | Reutiliza paginación de 100 filas del servicio de tickets; el ranking se hace en memoria sobre `todo`, conjunto pequeño.        |
| RLS de comentarios mal aplicada expone datos entre usuarios             | Políticas own idénticas a `resources` + trigger `prevent_user_id_change`; verificación manual con dos sesiones.                 |
| El catch global del CLI no sabe si `--json` estaba activo               | `main.ts` detecta `--json` en `process.argv` y delega en `writeErrorOutput`; cubierto con test del helper.                      |

## Qué **no** está en esta spec

- Docs/wiki por proyecto con Mermaid y export al repo (capa 2).
- Servidor MCP sobre `forge-cli`.
- Realtime, polling o refresco remoto de comentarios.
- Notificaciones al mover a `review` y analítica de review.
- Markdown, edición, borrado o paginación de comentarios.
- `--body-file`/stdin para comentarios.
- `--column` en `ticket next`.
- `branch`/`pr_url` en la creación de tickets y en la tarjeta del board.
- Cambios a componentes bajo `apps/web/src/components/ui`.

Cada elemento futuro deberá definirse en su propia spec.

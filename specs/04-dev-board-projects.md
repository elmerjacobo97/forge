# SPEC 04 — Proyectos en el Dev Board

> **Status:** Implemented
> **Depends on:** Ninguna (convive con SPEC 03; el CLI de tickets queda desalineado hasta una spec posterior)
> **Date:** 2026-07-19
> **Objective:** Añadir proyectos al Dev Board web de modo que cada ticket pertenezca a un proyecto y el kanban (y analytics) se vean por proyecto.

## Alcance

**Incluye:**

- Nueva entidad `Project` en Appwrite (tabla dedicada) con CRUD en la web: crear, listar, editar (`name`, `description`), borrar.
- Variable de entorno `VITE_APPWRITE_DEV_BOARD_PROJECTS_TABLE_ID` (y entrada en `.env.example`).
- Campo obligatorio `projectId` en tickets; list/create/update/move/delete de tickets filtrados por proyecto.
- Rutas web:
  - `/dev-board` — lista de proyectos (+ CTA crear si está vacía).
  - `/dev-board/$projectId` — kanban del proyecto.
  - `/dev-board/$projectId/analytics` — analytics filtrados a ese proyecto.
- Delete de proyecto bloqueado si aún tiene tickets (mensaje claro; no cascade).
- Prerrequisito operativo: borrar a mano los tickets de prueba existentes antes de exigir `projectId` en Appwrite (no hay script de migración).
- Actualizar tipos, schemas, servicios, hooks y UI del feature `dev-board` para el flujo lista → board.
- Tests unitarios de validación/helpers nuevos o afectados (Vitest, sin Appwrite real).

**Fuera de alcance (specs futuras):**

- CLI (`forge-cli ticket` / `project`) y skills de agentes; quedan desalineados hasta otra spec.
- Mover tickets entre proyectos.
- Cascade delete de tickets (ni events/time entries) al borrar un proyecto.
- Color, archive/soft-delete, miembros/colaboración, plantillas de columnas por proyecto.
- Proyecto “default” / “Inbox” automático.
- Package compartido web/CLI.
- Cambios en otras features (bookmarks, snippets, etc.).

## Modelo de datos

Nueva entidad y cambio en tickets. Events y time entries no cambian de forma (siguen ligados a `ticketId` + `userId`); el filtrado de analytics es por tickets del `projectId`.

```ts
type Project = {
  id: string;
  name: string;
  description: string; // "" si vacío
  createdAt: string; // row.$createdAt
};

// Ticket existente + projectId obligatorio
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

Fila Appwrite — tabla projects (`VITE_APPWRITE_DEV_BOARD_PROJECTS_TABLE_ID`):

- `userId`, `name`, `description` + `$id` / `$createdAt`
- Permisos por usuario (`Role.user(userId)`), mismo patrón que tickets

Fila Appwrite — tabla tickets (cambio):

- Añadir atributo `projectId` (string, required)
- Queries de listado: `userId` + `projectId` (+ `column` si aplica)
- Create escribe `projectId` del contexto de ruta

Entradas de formulario:

```ts
type ProjectCreateInput = {
  name: string; // trim, 1–80
  description: string; // default ""; máx 2000
};

type ProjectUpdateInput = Partial<ProjectCreateInput>;
```

Convenciones:

- Un ticket pertenece a un solo proyecto; no hay reasignación en v1.
- Columnas y prioridades del kanban no cambian (`backlog|todo|in_progress|review|done`, `low|med|high`).
- Posición / timer / events / time entries: misma semántica que hoy, pero siempre dentro del `projectId` activo.
- Borrar proyecto: solo si `count(tickets where projectId)` es 0; si no, error claro sin borrar nada.
- Prerrequisito: vaciar la tabla de tickets de prueba antes de marcar `projectId` required en Appwrite.

## Plan de implementación

1. Crear tabla Appwrite de projects y añadir atributo `projectId` (required) a tickets. Documentar en `.env.example` la clave `VITE_APPWRITE_DEV_BOARD_PROJECTS_TABLE_ID`. Prerrequisito: vaciar tickets de prueba. Comprobar: env local apunta a la nueva tabla.

2. Añadir tipos `Project` y extender `Ticket` con `projectId` en `apps/web/src/features/dev-board/types/`. Schema Zod de proyecto (`name` 1–80, `description` máx 2000). Comprobar: tests unitarios de schema pasan/fallan como se espera.

3. Implementar servicio de projects (list/get/create/update/delete) en `features/dev-board/services/`, con permisos por `userId`. Delete comprueba que no haya tickets del `projectId` antes de borrar. Comprobar manualmente con cuenta de prueba: CRUD de un proyecto vacío.

4. Actualizar `dev-board-service` (y analytics service) para exigir/filtrar por `projectId` en list/create/move y en lecturas de events/time entries vía tickets del proyecto. Comprobar: tickets de un proyecto no aparecen en otro.

5. Hooks TanStack Query (queries/mutations) para projects y para tickets scoped por `projectId`. Comprobar: cache keys incluyen `projectId` donde corresponde.

6. Ruta `/dev-board`: lista de proyectos + formulario/dialog crear/editar + delete (bloqueado si hay tickets) + CTA vacío. Comprobar: sin proyectos se ve el CTA; con proyectos se listan y se puede entrar a uno.

7. Mover el kanban actual a `/dev-board/$projectId` (ruta thin + feature). Link a analytics del proyecto. Comprobar: create/move/delete de tickets solo afectan ese board.

8. Mover analytics a `/dev-board/$projectId/analytics` con datos filtrados al proyecto. Comprobar: métricas no mezclan tickets de otros proyectos.

9. Tests unitarios de helpers afectados (delete guard, filtros, schemas). Comprobar: `pnpm --filter @forge/web test` y `pnpm build:web` pasan.

## Criterios de aceptación

- [ ] Existe `VITE_APPWRITE_DEV_BOARD_PROJECTS_TABLE_ID` en `.env.example` y la app la usa para CRUD de proyectos.
- [ ] `/dev-board` muestra la lista de proyectos del usuario (o CTA “Crear proyecto” si no hay ninguno).
- [ ] Se puede crear un proyecto con `name` válido y `description` opcional; aparece en la lista.
- [ ] Se puede editar `name` / `description` de un proyecto propio y el cambio persiste tras recargar.
- [ ] Borrar un proyecto **sin** tickets lo elimina de la lista.
- [ ] Borrar un proyecto **con** tickets falla con mensaje claro; el proyecto y sus tickets siguen existiendo.
- [ ] `/dev-board/$projectId` muestra el kanban solo con tickets de ese proyecto.
- [ ] Crear un ticket desde el board escribe `projectId` correcto; no aparece en otro proyecto.
- [ ] Move / update / delete / timer / events de un ticket siguen la semántica actual y quedan acotados a su proyecto.
- [ ] `/dev-board/$projectId/analytics` refleja solo datos de tickets de ese proyecto.
- [ ] Proyecto inexistente o de otro usuario en la ruta falla de forma clara (no board vacío engañoso sin error).
- [ ] Inputs inválidos de proyecto (`name` vacío o >80, `description` >2000) se rechazan en el formulario.
- [ ] `pnpm --filter @forge/web test` y `pnpm build:web` pasan.
- [ ] El CLI de SPEC 03 no forma parte de esta entrega (queda documentado como desalineado).

## Decisiones

- **Sí:** Solo web (`apps/web`) en esta spec.
- **No:** Actualizar CLI / skills aquí. Evita mezclar migración de UI con comandos; va en una spec posterior.
- **Sí:** Tabla Appwrite dedicada para projects (`VITE_APPWRITE_DEV_BOARD_PROJECTS_TABLE_ID`).
- **No:** Usar la colección genérica `appwrite-data`. Los tickets necesitan queries por `projectId` a escala.
- **Sí:** Campos de proyecto en v1: `name` + `description` opcional.
- **No:** Color, archive, miembros, columnas custom por proyecto.
- **Sí:** Sin migración de tickets existentes; se borran a mano los de prueba antes de exigir `projectId`.
- **No:** Proyecto default automático (“Inbox”).
- **Sí:** UX lista en `/dev-board` → kanban en `/dev-board/$projectId` → analytics en `/dev-board/$projectId/analytics`.
- **No:** Un solo board global con selector de contexto sin ruta.
- **Sí:** Delete de proyecto bloqueado si tiene tickets.
- **No:** Cascade delete de tickets/events/time entries al borrar proyecto.
- **Sí:** Un ticket no se reasigna a otro proyecto en v1.
- **No:** Mover tickets entre proyectos.
- **Sí:** Analytics filtrados por proyecto.
- **No:** Analytics globales mezclando todos los proyectos en esta entrega.

## Riesgos

| Riesgo                                                                   | Mitigación                                                                                                                                                                                        |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Atributo `projectId` required en Appwrite falla si quedan tickets viejos | Prerrequisito explícito: vaciar tickets de prueba antes de desplegar el atributo.                                                                                                                 |
| `forge-cli ticket` de SPEC 03 deja de poder crear/listar correctamente   | Fuera de alcance; documentado en decisiones y “qué no está”. Spec posterior para CLI.                                                                                                             |
| Analytics filtra mal y mezcla proyectos                                  | Filtrar por `projectId` en queries de tickets y derivar events/time entries solo de esos `ticketId`s; cubrir con test de helper si aplica.                                                        |
| Delete de proyecto con race (tickets creados entre check y delete)       | Re-check de conteo justo antes del delete; si Appwrite no es atómico, el peor caso es un delete fallido o tickets huérfanos — documentar y preferir fallar el delete si el listado no está vacío. |
| Ruta `/dev-board` cambia de significado (era el board)                   | Login ya redirige a `/dev-board` (lista); enlaces internos/analytics antiguos se actualizan en el mismo PR.                                                                                       |

## Qué **no** está en esta spec

- CLI (`forge-cli ticket` / comandos `project`) y skills de agentes.
- Mover tickets entre proyectos.
- Cascade delete al borrar un proyecto.
- Color, archive, miembros, columnas custom por proyecto.
- Proyecto default automático.
- Package compartido web/CLI.
- Otras features (bookmarks, snippets, etc.).

Cada uno de esos, si entra, va en su propia spec.

# SPEC 24 — Inbox de revisión

> **Estado:** Implementado
> **Depende de:** SPEC 04 — Proyectos en el Dev Board · SPEC 17 — Loop de agente sobre tickets · SPEC 22 — Estados, búsqueda y filtros de proyectos
> **Fecha:** 2026-09-24
> **Objetivo:** Añadir en la web una cola en `/dev-board/inbox` con los tickets en validation y review de los proyectos no archivados, mostrando proyecto, título, columna, enlace al PR y último comentario.

## Alcance

**Incluye:**

- Una página `/dev-board/inbox`, con la misma sesión que el resto de Dev Board.
- Un enlace "Inbox" en la barra de `/dev-board`, junto a la búsqueda y el filtro de estado. No se registra en `apps/web/src/lib/tools.ts`, así que no entra al sidebar ni al command palette.
- Listar los tickets en `validation` o `review` cuyo proyecto no está `archived`. Entran `planned`, `in_progress`, `paused` y `completed`.
- Una tabla con proyecto, título, columna, enlace al PR y último comentario. La columna se muestra como Validation o Review.
- El enlace al PR usa `prUrl`. Si es null, la celda queda vacía. Si existe, abre esa URL en una pestaña nueva.
- El último comentario es el más reciente, sea `user` o `agent`, con autor y extracto. Si el ticket no tiene comentarios, la celda queda vacía.
- Orden fijo: `last_moved_at` ascendente. El que más tiempo lleva en su columna va primero.
- El título enlaza a `/dev-board/{projectId}?ticket={ticketId}`. El tablero abre el diálogo de edición de ese ticket, el mismo de Edit.
- Si el `ticket` de la URL no existe o no pertenece a ese proyecto, el tablero abre sin diálogo.
- Lista completa, sin paginación, filtros ni orden elegible. Se lee al cargar la página.

**Fuera de alcance (para specs futuras):**

- CLI y MCP.
- Entrada en el sidebar o en el command palette.
- Contador o badge en el enlace Inbox.
- Mostrar `branch`.
- Mover, comentar, pausar o editar desde la cola.
- Marcar un ticket como ya mirado.
- Filtrar la cola por proyecto, columna o autor.
- Paginación y suscripción en tiempo real.
- Incluir proyectos `archived`.

## Modelo de datos

Esta spec no añade tablas, columnas ni RPC. Reusa `dev_board_tickets`, `dev_board_projects` y `dev_board_ticket_comments`. La fila de la cola es un tipo de lectura.

```ts
export const REVIEW_INBOX_COLUMNS = ["validation", "review"] as const;
export type ReviewInboxColumn = (typeof REVIEW_INBOX_COLUMNS)[number];

export const REVIEW_INBOX_EXCERPT_LENGTH = 160;

export interface ReviewInboxComment {
  author: "user" | "agent";
  excerpt: string;
}

export interface ReviewInboxItem {
  ticketId: string;
  projectId: string;
  projectName: string;
  title: string;
  column: ReviewInboxColumn;
  prUrl: string | null;
  lastMovedAt: string;
  comment: ReviewInboxComment | null;
}
```

El tipo vive en `apps/web/src/features/dev-board/types/review-inbox.ts`.

Reglas:

- Entran tickets con `column_id` en `validation` o `review` cuyo `dev_board_projects.status` no es `archived`. RLS sigue limitando al usuario de la sesión.
- `projectName` sale de `dev_board_projects.name`. `prUrl` sale de `dev_board_tickets.pr_url` y puede ser null.
- `lastMovedAt` es `dev_board_tickets.last_moved_at`. El RPC de movimiento lo actualiza al cambiar de columna. Comentarios y ediciones no lo tocan.
- Orden: `lastMovedAt` ascendente. Empate por `ticketId` ascendente.
- `comment` es el comentario con `created_at` más reciente de ese ticket. `author` se conserva. `excerpt` es `body` en una sola línea, cortado a 160 caracteres. Si se corta, termina en `…`. Si no hay comentarios, `comment` es null.
- La URL del tablero lee `ticket` como UUID. Ejemplo: `/dev-board/{projectId}?ticket={ticketId}`.

## Plan de implementación

### Grupo 1 — Lectura de la cola

- [x] 1.1 Crear `apps/web/src/features/dev-board/types/review-inbox.ts` con `REVIEW_INBOX_COLUMNS`, `REVIEW_INBOX_EXCERPT_LENGTH`, `ReviewInboxComment` y `ReviewInboxItem`.
- [x] 1.2 Añadir en `apps/web/src/features/dev-board/utils/review-inbox.ts` el extracto y el orden. El extracto deja el texto en una línea, corta a 160 caracteres y cierra con `…` si recorta. El orden es `lastMovedAt` ascendente y, en empate, `ticketId` ascendente. Cubrir ambos en `utils/review-inbox.test.ts`.
- [x] 1.3 Añadir `listReviewInbox` en `apps/web/src/features/dev-board/services/review-inbox-service.ts`. Lee los tickets en `validation` y `review` sin el paginado de 25 del tablero, descarta proyectos `archived` y toma el comentario más reciente de cada ticket. No añade RPC. Probar en `services/review-inbox-service.test.ts` que un proyecto `archived` no sale, que un `prUrl` null se conserva, que sin comentarios `comment` es null y que el orden respeta `lastMovedAt`.

### Grupo 2 — Página `/dev-board/inbox`

- [x] 2.1 Crear `apps/web/src/app/(authenticated)/dev-board/inbox/page.tsx`. Carga `listReviewInbox` y renderiza la cola. `getToolByPath` ya reconoce `/dev-board/inbox` como Dev Board, así que `tools.ts` no cambia.
- [x] 2.2 Crear `apps/web/src/features/dev-board/components/review-inbox.tsx` con la tabla shadcn: proyecto, título, columna (`COLUMN_LABELS`), PR y último comentario. El título apunta a `/dev-board/{projectId}?ticket={ticketId}`. El PR, si existe, abre `prUrl` en una pestaña nueva. El autor se muestra como `you` o `agent`. Sin filas, el vacío dice "Nothing waiting in validation or review." El encabezado de la página dice "Inbox".
- [x] 2.3 Cubrir la tabla en `components/review-inbox.test.tsx`: fila con PR, fila sin PR, fila sin comentario y estado vacío.

### Grupo 3 — Entrada y ticket abierto

- [x] 3.1 Añadir el enlace "Inbox" a `/dev-board/inbox` en `project-list-toolbar.tsx`, en la misma barra que la búsqueda y el filtro. Comprobar el href en `project-list-toolbar.test.tsx`.
- [x] 3.2 Hacer que `dev-board/[projectId]/page.tsx` lea `ticket`. Si es un UUID, carga ese ticket. Si no existe o su `projectId` no coincide, pasa null.
- [x] 3.3 Hacer que `ProjectBoard` reciba ese ticket y abra el diálogo de edición, el mismo de Edit, al montar. Si el ticket es null, el tablero abre sin diálogo.
- [x] 3.4 Cubrir en `page.test.tsx` y `project-board.test.tsx` tres casos: UUID ajeno al proyecto, id inválido y UUID del proyecto. Solo el último abre el diálogo.

## Criterios de aceptación

- [x] `/dev-board/inbox` lista solo tickets en `validation` o `review`.
- [x] Un ticket de un proyecto `archived` no aparece. Sí aparecen los de proyectos `planned`, `in_progress`, `paused` y `completed`.
- [x] Cada fila muestra proyecto, título, columna, PR y último comentario. La columna dice Validation o Review.
- [x] La fila no muestra `branch` ni acciones para mover, comentar o editar.
- [x] Si `prUrl` es null, la celda del PR queda vacía. Si existe, el enlace abre esa URL en una pestaña nueva.
- [x] El comentario mostrado es el de `created_at` más reciente, sea `user` o `agent`. El autor se lee `you` o `agent`.
- [x] Sin comentarios, la celda queda vacía. El extracto va en una línea, corta a 160 caracteres y termina en `…` si se recorta.
- [x] El orden es `lastMovedAt` ascendente. En empate, gana el `ticketId` menor.
- [x] El título apunta a `/dev-board/{projectId}?ticket={ticketId}`.
- [x] Con un `ticket` UUID de ese proyecto, el tablero abre el diálogo de edición. Con un id inválido, un ticket inexistente o un ticket de otro proyecto, el tablero abre sin diálogo.
- [x] La barra de `/dev-board` tiene un enlace "Inbox" a `/dev-board/inbox`.
- [x] `apps/web/src/lib/tools.ts` no gana una entrada. El sidebar y el command palette no listan Inbox.
- [x] Con cero tickets, la página dice "Nothing waiting in validation or review."
- [x] La lista no está paginada: un ticket en esas columnas, fuera de los primeros 25 del tablero, igual aparece.
- [x] No hay migración ni RPC nuevos.

## Decisiones

- **Sí:** La cola son todos los tickets que están ahora en `validation` o `review`. Salen de la lista cuando cambian de columna.
- **No:** Limitarla a `review`, o a los tickets cuyo último comentario es del agente. Validation también es trabajo pendiente de mirar.
- **Sí:** Página propia en `/dev-board/inbox`, con el enlace "Inbox" en la barra de `/dev-board`.
- **No:** Una pestaña que reemplace la tabla de proyectos, un bloque encima de esa tabla, o una herramienta nueva en el sidebar y el command palette. Es la cola diaria de Dev Board.
- **Sí:** Desde la fila solo se lee y se sale. El título abre el ticket. El PR abre `prUrl`.
- **No:** Mover a `done`, devolver a `in_progress`, comentar o abrir un panel lateral en la cola. Eso sigue en el tablero.
- **Sí:** Entran todos los proyectos menos `archived`. Incluye `planned`, `in_progress`, `paused` y `completed`.
- **No:** Limitarla a `in_progress`, o sacar también `completed`. Un ticket en review sigue pendiente aunque el proyecto esté pausado o terminado.
- **Sí:** Esta spec es solo web.
- **No:** CLI y MCP en esta spec. El contrato ya está cerrado; cada superficie, si llega, va en la suya.
- **Sí:** Orden por `lastMovedAt` ascendente. Es el tiempo en la columna, porque el RPC de movimiento lo actualiza y un comentario no.
- **No:** El comentario más reciente primero, ni Validation delante de Review.
- **Sí:** Cada fila lleva columna y el comentario más reciente, sea `user` o `agent`, con autor y extracto de 160 caracteres.
- **No:** Mostrar solo el comentario del agente, omitir la columna, o mostrar `branch`.
- **Sí:** Un ticket sin `prUrl` se muestra igual, con la celda vacía.
- **No:** Ocultarlo hasta que tenga PR, o marcar la fila como incompleta.
- **Sí:** El título va a `/dev-board/{projectId}?ticket={ticketId}` y el tablero abre el diálogo de Edit.
- **No:** Enlazar solo al tablero y dejar el ticket para buscarlo a mano.
- **Sí:** Sin tablas, columnas ni RPC nuevos. La lista reusa `dev_board_tickets`, `dev_board_projects` y `dev_board_ticket_comments`.
- **No:** Un estado de "ya lo miré", filtros, paginación o tiempo real. La cola es el contenido de esas dos columnas al cargar la página.

## Riesgos

| Riesgo                                                                            | Mitigación                                                                                                                                    |
| --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Reusar el paginado de 25 del tablero deja tickets de la cola fuera.               | `listReviewInbox` no usa `TICKETS_PAGE_SIZE`. El criterio de aceptación exige que un ticket pasado el primer page del tablero igual aparezca. |
| El ticket de `?ticket=` puede no estar entre las tarjetas cargadas de su columna. | La página lo carga por id y `ProjectBoard` abre Edit con ese ticket. El diálogo no depende de la tarjeta.                                     |
| Un comentario por ticket, en consultas separadas, hace lenta la cola.             | Una lectura de comentarios para los ids de la cola. El más reciente se elige en memoria.                                                      |

## Qué **no** está en esta spec

- CLI y MCP.
- Una entrada en el sidebar o en el command palette.
- Un contador o badge en el enlace Inbox.
- Mostrar `branch`.
- Mover, comentar, pausar o editar desde la cola.
- Marcar un ticket como ya mirado.
- Filtrar la cola por proyecto, columna o autor.
- Paginación y suscripción en tiempo real.
- Incluir proyectos `archived`.
- Tablas, columnas o RPC nuevos.

Cada uno, si llega, va en su propia spec.

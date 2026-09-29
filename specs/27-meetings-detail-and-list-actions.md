# SPEC 27 — Detalle de reuniones y acciones del listado

> **Estado:** Approved
> **Depende de:** SPEC 26 — Reuniones y responsables de tickets
> **Fecha:** 2026-09-26
> **Objetivo:** Separar el detalle de reunión en una vista de lectura con botones Editar y Eliminar, añadir acciones por fila en el listado y homologar la página de Meetings con las demás herramientas.

## Scope

**Incluye:**

- Vista de detalle en modo lectura en `/meetings/[meetingId]`: título, fecha y hora, proyecto, asistentes, contexto, decisiones y próximos pasos con su estado. Con botones **Editar** y **Eliminar** explícitos.
- Mover el editor de página completa a `/meetings/[meetingId]/edit`. El botón Editar navega ahí; al guardar, vuelve al detalle con los datos actualizados.
- Menú de acciones por fila en el listado (Editar, Eliminar) con diálogo de confirmación compartido entre listado y detalle.
- Homologar el listado al patrón de Ideas: contenedor con borde, fila con título y metadatos (fecha, proyecto, asistentes, decisiones), menú a la derecha y enlace al detalle. Se mantienen búsqueda, filtro por proyecto y paginación.
- Header de Meetings solo con título y descripción, con los tamaños de las demás páginas (`text-lg` + `text-xs`); quitar el eyebrow «Field notes».
- Quitar el chequeo de sesión duplicado en las páginas de Meetings; el layout autenticado ya lo hace.
- Corregir `loading.tsx` y skeletons para que calcen con el layout final, incluido el nuevo detalle.
- Verificar el guardado y borrado actuales (servicio + Server Actions) y corregir cualquier fallo, con test que lo cubra.
- Actualizar los tests colocate afectados y cualquier referencia a la ruta del editor que quede desactualizada.

**Fuera de alcance:**

- Editar en diálogo y rediseño del editor.
- Listado en tarjetas o cambios de estructura de datos, migraciones y RLS.
- Cambios en CLI, MCP o `packages/forge-core`.
- Nuevas funciones de próximos pasos más allá de mostrarlos en el detalle.

## Modelo de datos

No hay tablas, columnas, índices ni RPC nuevos. El spec reutiliza el esquema de la SPEC 26: `public.meetings`, `public.meeting_action_items` y `dev_board_tickets.responsible_name`.

La vista de detalle consume los tipos existentes `Meeting`, `MeetingDetail`, `MeetingActionItem` y `MeetingLinkedTicket` de `apps/web/src/features/meetings/types/index.ts`, servidos por `meetingsService.getMeeting` ya existente. Si la verificación del guardado o borrado encuentra un defecto, se corrige en el servicio o en las Server Actions, sin tocar el esquema.

## Plan de implementación

### Grupo 1 — Verificación del servicio y detalle en lectura

- [x] **1.1** Reproducir guardado y borrado actuales con tests de servicio y Server Actions; corregir cualquier fallo en `meetingsService.updateMeeting`/`deleteMeeting` o en `actions.ts` antes de tocar la UI.
- [x] **1.2** Crear `apps/web/src/features/meetings/components/meeting-detail.tsx` (solo lectura) y la página `/meetings/[meetingId]` que la use, con loading propio; mostrar título, fecha, proyecto, asistentes, contexto, decisiones y próximos pasos con su estado, más botones Editar y Eliminar.
- [x] **1.3** Mover el editor a `/meetings/[meetingId]/edit` reutilizando `MeetingEditor`; Editar navega ahí y al guardar vuelve al detalle con los datos actualizados. Ajustar revalidaciones y pruebas de página.

### Grupo 2 — Borrado compartido y acciones del listado

- [x] **2.1** Extraer `delete-meeting-dialog.tsx` desde el editor, con copy genérico (los tickets no se borran); usarlo en detalle y listado, con toast y navegación a `/meetings`.
- [x] **2.2** Crear `meeting-row.tsx` con `DropdownMenu` (Editar, Eliminar) y enlace al detalle; retirar la fila embebida del historial.
- [x] **2.3** Llevar el listado al patrón de Ideas: contenedor con borde, fila con título y metadatos, menú a la derecha; conservar búsqueda, filtro por proyecto, paginación y estados vacíos.

### Grupo 3 — Homologación visual, loading y cierre

- [x] **3.1** Dejar el header solo con título y descripción en tamaños homologados; quitar «Field notes» y el chequeo de sesión duplicado en las páginas de Meetings.
- [x] **3.2** Corregir skeletons: `meetings/loading.tsx` al nuevo layout de filas, y loadings nuevos para detalle y edición. El skeleton del editor se inlinea en `new/loading.tsx` y `[meetingId]/edit/loading.tsx` (se elimina `meeting-editor-skeleton.tsx`).
- [x] **3.3** Actualizar tests colocate y referencias a la ruta del editor; correr `pnpm test`, `pnpm build` y `pnpm lint`.

## Criterios de aceptación

**Detalle y edición**

- [x] `/meetings/[meetingId]` muestra la reunión en modo lectura —fecha, proyecto, asistentes, contexto, decisiones y próximos pasos con su estado— y nunca renderiza el formulario.
- [x] El detalle tiene botones Editar y Eliminar visibles; Editar abre `/meetings/[meetingId]/edit` y Eliminar abre el diálogo de confirmación.
- [x] Guardar en el editor persiste los cambios y vuelve al detalle con los datos actualizados.
- [x] Un id inválido o inexistente devuelve not found; sin sesión, el layout redirige a login.

**Listado**

- [x] Cada fila tiene menú con Editar (navega al editor) y Eliminar (diálogo de confirmación).
- [x] Confirmar el borrado desde el listado elimina la reunión, conserva los tickets, muestra toast y actualiza el listado.
- [x] Búsqueda, filtro por proyecto, paginación y estados vacíos siguen funcionando.

**Homologación**

- [x] Header solo con título y descripción, con tamaños iguales a Ideas y Resources; sin «Field notes».
- [ ] Los loadings de listado, detalle y edición calzan con su layout final, sin saltos visibles.
- [x] Ninguna página de Meetings repite el chequeo de sesión.

**Datos y seguridad**

- [x] Sin migraciones ni cambios de esquema; RLS y propiedad intactas.
- [x] Borrar una reunión nunca borra tickets; borrar un ticket no rompe la reunión.

**Verificación**

- [x] Tests cubren detalle, menú de fila, borrado compartido y guardado, sin conectarse a InsForge real.
- [x] `pnpm test`, `pnpm build` y `pnpm lint` pasan.
- [ ] Revisión manual: crear, abrir detalle, editar, guardar y eliminar desde detalle y desde listado.

## Decisiones

- **Sí:** Detalle read-only en `/meetings/[meetingId]` y editor de página completa en `/meetings/[meetingId]/edit`.
- **Sí:** Botones Editar y Eliminar explícitos en el detalle; menú por fila con las mismas acciones en el listado.
- **Sí:** Un solo diálogo de eliminación, compartido entre listado y detalle. Desde el listado no consulta tickets vinculados; el copy aclara que los tickets no se borran.
- **Sí:** Listado con filas estilo Ideas. Se conservan búsqueda, filtro por proyecto y paginación.
- **Sí:** Header solo con título y descripción, tamaños iguales a Ideas/Resources. Fuera «Field notes».
- **Sí:** Quitar el chequeo de sesión duplicado en las páginas de Meetings; el layout autenticado es la única puerta.
- **Sí:** Sin migraciones ni cambios de esquema. Se reutilizan los servicios y tablas de la SPEC 26; si el guardado o el borrado tienen un fallo, se corrige dentro de este spec.
- **No:** Editar en diálogo. Se mantiene la página completa, como pidió el usuario.
- **No:** Listado en tarjetas y cambios a las reglas de conversión de próximos pasos.
- **No:** Cambios en CLI, MCP o `packages/forge-core`.

## Riesgos

| Riesgo                                                                                | Mitigación                                                                                                              |
| ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| La causa del fallo al guardar o borrar no está confirmada.                            | El grupo 1 empieza reproduciendo con tests de servicio y acciones; no se avanza a la UI hasta localizarla y corregirla. |
| Mover el editor a `/meetings/[meetingId]/edit` puede romper enlaces existentes.       | Buscar todas las referencias a `/meetings/` —atajo del board, toasts, tests— y actualizarlas junto con el cambio.       |
| Eliminar desde el listado sin conteo de tickets puede sorprender al usuario.          | El diálogo compartido aclara que los tickets permanecen; el conteo solo aparece donde ya existe, en el detalle.         |
| Dos puntos de borrado —detalle y listado— podrían divergir con el tiempo.             | Un único componente de diálogo y una única `deleteMeetingAction`.                                                       |
| Los skeletons y tests de layout pueden quedar desalineados tras el rediseño de filas. | Actualizar `loading.tsx` y tests colocate junto con cada componente; revisión manual de listado, detalle y edición.     |

## Qué no está en esta spec

- Editar en diálogo, tarjetas o rediseño del editor.
- Cambios de esquema, migraciones o RLS.
- Cambios en CLI, MCP o `packages/forge-core`.
- Nuevas funciones de próximos pasos o de conversión a tickets.

Cada elemento, si llega, requiere otra spec.

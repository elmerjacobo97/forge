# SPEC 26 — Reuniones y responsables de tickets

> **Estado:** Approved  
> **Depende de:** SPEC 03 — CLI para tickets · SPEC 04 — Proyectos del Dev Board · SPEC 17 — Loop de tickets · SPEC 23 — Escritura de tickets en MCP  
> **Fecha:** 2026-09-26  
> **Objetivo:** Crear una bitácora privada de reuniones con contexto, decisiones y próximos pasos, permitir convertirlos explícitamente en tickets e incorporar un responsable de texto libre a todos los tickets de Forge.

## Scope

**Incluye:**

- Una herramienta **Meetings** en el sidebar y una lista global de reuniones, con búsqueda por título/contexto y filtro por proyecto.
- Un editor de página completa para crear y editar reuniones. Cada proyecto tendrá un atajo para crear una reunión con ese proyecto preseleccionado; asociar un proyecto será opcional.
- Captura manual de fecha y hora —por defecto, ahora—, asistentes opcionales como nombres de texto libre, contexto, decisiones y próximos pasos.
- Próximos pasos con título, detalle opcional, responsable como texto libre, fecha límite opcional y opción para marcarlos como completados mientras no sean tickets.
- Conversión explícita de un próximo paso en ticket. Forge lo crea directamente en el Backlog del proyecto, con prioridad media, y conserva el próximo paso vinculado a ese ticket. Si la reunión no tiene proyecto, se elige uno al crearlo.
- Un campo **Responsable** opcional de texto libre en todos los tickets, visible y editable desde web, CLI y MCP. Los tickets existentes quedan sin responsable.
- Borrar una reunión sin borrar los tickets que ya se crearon desde ella.

**Fuera de alcance:**

- Grabar reuniones, transcribir audio o generar resúmenes con IA.
- Estados o flujos de aprobación, o integración con Ideas. Los próximos pasos permanecen en la reunión hasta que el usuario decida crear un ticket.
- Asignar tickets a cuentas de Forge, compartir reuniones, invitar asistentes o enviar notificaciones.
- Añadir fechas límite al modelo de tickets. La fecha límite del próximo paso permanece en la reunión.
- Gestionar reuniones desde CLI o MCP; esas superficies solo reciben el campo Responsable de tickets.
- Calendario, invitaciones, reuniones recurrentes o adjuntos.

## Modelo de datos

La migración añade dos tablas y un campo opcional a los tickets existentes.

```sql
public.meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID NULL REFERENCES public.dev_board_projects(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  meeting_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  attendees TEXT[] NOT NULL DEFAULT '{}',
  context TEXT NOT NULL DEFAULT '',
  decisions TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

public.meeting_action_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  details TEXT NOT NULL DEFAULT '',
  responsible_name TEXT NULL,
  due_date DATE NULL,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  ticket_id UUID NULL REFERENCES public.dev_board_tickets(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.dev_board_tickets
  ADD COLUMN responsible_name TEXT NULL;
```

Tipos de aplicación:

```ts
interface Meeting {
  id: string;
  projectId: string | null;
  title: string;
  meetingAt: string;
  attendees: string[];
  context: string;
  decisions: string[];
  createdAt: string;
  updatedAt: string;
}

interface MeetingActionItem {
  id: string;
  meetingId: string;
  title: string;
  details: string;
  responsibleName: string | null;
  dueDate: string | null;
  isCompleted: boolean;
  ticketId: string | null;
  createdAt: string;
  updatedAt: string;
}

// Ticket añade:
responsibleName: string | null;
```

Convenciones:

- Las tablas de reuniones tienen índices para usuario/fecha, proyecto/fecha y acciones por reunión.
- Ambas tablas aplican RLS por usuario, triggers `updated_at` y protección contra cambiar `user_id`. Una reunión solo puede asociarse a un proyecto del mismo usuario.
- Eliminar un proyecto deja la reunión con `project_id = NULL`; no elimina la nota. Eliminar una reunión elimina sus acciones, pero nunca los tickets. Eliminar un ticket deja su acción con `ticket_id = NULL`.
- `responsible_name` es texto libre nullable en reuniones, acciones y tickets; un valor vacío se normaliza a `NULL`. Los tickets existentes siguen siendo válidos con `NULL`.
- El título de un próximo paso respeta el límite actual del título de ticket web (1–120 caracteres); el detalle se limita a 2000 caracteres para poder copiarlo como descripción del ticket. Los campos de nombre de responsable se recortan y limitan a 120 caracteres.
- La búsqueda del historial usa título/contexto, filtra por proyecto y ordena por `meeting_at DESC, id DESC`. Búsqueda, filtro y paginación viven en la URL.
- Crear un ticket desde una acción usa `create_dev_board_ticket_from_meeting_action(p_action_item_id, p_project_id)`. La RPC verifica sesión, propiedad de la acción y del proyecto, bloquea la acción durante la conversión y crea/vincula el ticket en una sola transacción. Si ya existe un ticket vinculado, devuelve ese ticket sin crear otro.
- Si la reunión tiene proyecto, la conversión usa ese proyecto. Si no, `p_project_id` debe identificar un proyecto propio. El ticket recibe el título, el detalle como descripción y el responsable; se crea en `backlog` con prioridad `med`. La fecha límite no se copia.
- Las RPC existentes de creación y actualización de tickets aceptan el nuevo responsable de forma compatible. Omitirlo en una actualización conserva el valor; una entrada vacía explícita lo limpia. Mover un ticket no cambia su responsable.
- Una acción sin ticket puede marcarse completada. Una acción vinculada conserva el enlace y consulta su progreso en Dev Board; no se mantiene un estado duplicado en la reunión.
- Meetings es una superficie web. El campo Responsable de tickets se expone en web, CLI y MCP.

## Plan de implementación

### Grupo 1 — Persistencia y conversión atómica

- [x] **1.1** Crear una migración en `migrations/` con `dev_board_tickets.responsible_name` y las tablas `public.meetings` y `public.meeting_action_items`, sus índices, triggers y políticas RLS. Al borrar un proyecto, conservar la reunión sin proyecto; al borrar una reunión, no borrar sus tickets.
- [x] **1.2** Extender los RPC de creación y actualización de tickets para guardar el responsable, y añadir `create_dev_board_ticket_from_meeting_action`. El RPC valida usuario, acción y proyecto, crea el ticket y lo vincula en una transacción; repetir la operación no crea duplicados.

### Grupo 2 — Responsable en los tickets existentes

- [x] **2.1** Extender los tipos, schema y servicio de tickets en `packages/forge-core/`; agregar `--responsible` y `--clear-responsible` al CLI y mostrar el valor en sus salidas. Cubrir validación, creación, actualización y limpieza con tests.
- [x] **2.2** Extender los schemas y handlers de `apps/mcp/src/` para crear, actualizar y leer el responsable. Actualizar los tests y `apps/mcp/README.md`.
- [x] **2.3** Extender tipos, schemas, mapeo de filas, servicios y formulario web del Dev Board. Mostrar el responsable en las tarjetas y cubrir alta, edición, lectura y tickets antiguos sin responsable.

### Grupo 3 — Modelo y servicios de Meetings

- [x] **3.1** Crear `apps/web/src/features/meetings/` con tipos, schemas y servicios para reuniones y próximos pasos; incluir listado por fecha, búsqueda, filtro de proyecto y tests con InsForge mockeado.
- [x] **3.2** Añadir Server Actions con verificación de sesión, validación de entradas y revalidación de rutas. Cubrir alta, edición, completado, borrado seguro y conversión atómica a ticket con tests.

### Grupo 4 — Editor, navegación e integración

- [x] **4.1** Crear `/meetings` para el historial y `/meetings/new` y `/meetings/[meetingId]` para crear y editar en página completa. Guardar título, fecha/hora, asistentes, contexto, decisiones y próximos pasos; al crear desde el historial, volver a `/meetings`, y al crear desde un proyecto, volver a ese board. La ruta por ID permite abrir y editar reuniones existentes.
- [x] **4.2** Añadir en Meetings la búsqueda y filtro por proyecto, y controles para responsables, fechas límite y completado. Al convertir un paso, conservarlo vinculado al ticket; si no hay proyecto, pedir uno.
- [x] **4.3** Registrar Meetings en `apps/web/src/lib/tools.ts` y proteger la ruta en `apps/web/src/proxy.ts`. Añadir al board del proyecto el atajo **New meeting**, con el proyecto preseleccionado.
- [x] **4.4** Actualizar `README.md`, `docs/product.md`, `docs/ROADMAP.md`, `apps/cli/README.md` y `apps/mcp/README.md` para reflejar la herramienta y el campo Responsable.

## Criterios de aceptación

**Meetings**

- [x] Meetings aparece en el sidebar; la ruta exige sesión y ofrece crear una reunión en una página completa.
- [x] Desde un proyecto se puede iniciar la misma creación con ese proyecto preseleccionado. También se pueden crear reuniones sin proyecto.
- [x] Una reunión guarda título, fecha y hora editable —por defecto, la hora actual—, asistentes opcionales, contexto y decisiones.
- [x] Cada próximo paso admite título, detalle opcional, responsable como texto libre, fecha límite opcional y marcado de completado.
- [x] Los próximos pasos no crean tickets automáticamente. La lista global busca por título/contexto, filtra por proyecto y ordena por fecha reciente.
- [x] Al elegir **Crear ticket**, se usa el proyecto de la reunión o se pide seleccionar uno. El ticket entra en Backlog con prioridad media y recibe el título, detalle y responsable del próximo paso; la fecha límite permanece en la reunión.
- [x] La reunión conserva el próximo paso y muestra su ticket vinculado; el progreso de ese paso se consulta en Dev Board.
- [x] Borrar una reunión con tickets vinculados no borra esos tickets. Borrar un ticket no borra el próximo paso de la reunión.

**Responsable en tickets**

- [x] Todos los tickets pueden guardar un responsable opcional de texto libre; los existentes siguen cargando con `NULL`.
- [x] Se puede consultar, crear, editar y limpiar el responsable desde web, CLI y MCP.
- [x] Las actualizaciones que no incluyen el responsable conservan el valor actual; los valores inválidos se rechazan.

**Datos y seguridad**

- [x] Las tablas de reuniones aplican RLS por usuario. Una reunión solo puede vincularse a un proyecto propio.
- [x] La conversión comprueba usuario, acción y proyecto; una operación repetida no crea tickets duplicados. Si falla, la acción queda sin vínculo.
- [x] Borrar un proyecto deja la reunión sin proyecto, sin borrar sus notas.

**Verificación**

- [x] Tests cubren schemas, servicios, filtros, conversiones, errores, datos antiguos y aislamiento en web, Core/CLI y MCP, sin conectarse a InsForge real.
- [x] `pnpm test`, `pnpm build`, `pnpm lint` y `pnpm --filter @forge/mcp typecheck` pasan.
- [x] Una revisión manual confirma crear/editar/buscar reuniones, crear una desde un proyecto y promover un próximo paso sin perder la reunión ni su responsable.

## Decisiones

- **Sí:** Después de crear, volver al origen: `/meetings` si se inició desde el historial o al board si se inició desde un proyecto. `/meetings/[meetingId]` queda para abrir y editar una reunión ya creada.
- **Sí:** Meetings es una herramienta independiente en el sidebar, con un atajo dentro de cada proyecto. El atajo preselecciona el proyecto.
- **Sí:** Una reunión puede ser general o pertenecer a un proyecto. Si no tiene proyecto, se elige uno al crear un ticket.
- **Sí:** La captura es manual, en una página completa, con secciones distintas para contexto, decisiones y próximos pasos.
- **Sí:** Asistentes y responsables son nombres de texto libre. No requieren cuentas de Forge.
- **Sí:** El próximo paso puede tener fecha límite y marcarse completado mientras no esté vinculado a un ticket. Las fechas límite permanecen en la reunión.
- **Sí:** Crear un ticket es una acción explícita, no automática. Usa el proyecto disponible, Backlog y prioridad media; el próximo paso queda vinculado al ticket.
- **Sí:** Responsable es un campo opcional en todos los tickets y se puede leer y editar desde web, CLI y MCP. No es una asignación a una cuenta.
- **Sí:** Una sola spec cubre Meetings y el campo Responsable, como decidió el usuario, para definir el flujo completo de reunión a ticket.
- **No:** Grabación, transcripción, IA, aprobaciones, estados adicionales o integración con Ideas.
- **No:** Compartir reuniones, invitar asistentes o administrar Meetings desde CLI/MCP.
- **No:** Fechas límite en tickets ni sincronización de fechas entre reunión y Dev Board.
- **Sí:** Borrar una reunión no borra sus tickets; borrar un ticket deja el próximo paso guardado, sin vínculo.

## Riesgos

| Riesgo                                                                                                        | Mitigación                                                                                                                                     |
| ------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Un fallo o doble clic al convertir una acción podría crear un ticket duplicado o dejar la acción sin vínculo. | Crear y vincular dentro de una RPC transaccional; bloquear la acción durante la operación y devolver el ticket existente si ya fue convertida. |
| Una reunión podría enlazarse con el proyecto o ticket de otro usuario.                                        | Aplicar RLS y verificar dentro de la RPC que el usuario sea dueño de la reunión, la acción y el proyecto.                                      |
| Ampliar los RPC actuales podría romper clientes web, CLI o MCP.                                               | Añadir el campo opcional de forma compatible, conservar los valores existentes y cubrir las tres superficies con tests.                        |
| Borrar una reunión elimina su contexto y sus próximos pasos, aunque sus tickets sobrevivan.                   | Pedir confirmación al borrar; las acciones se eliminan con la reunión, pero nunca se borran los tickets.                                       |
| La hora de la reunión podría mostrarse distinta por zona horaria.                                             | Guardar el instante como `TIMESTAMPTZ` y comprobar que la UI lo convierte correctamente a la hora local.                                       |
| El responsable del ticket puede cambiar después de convertirlo, y diferir del anotado en la reunión.          | La reunión conserva el responsable histórico; el campo del ticket refleja el responsable actual. No hay sincronización bidireccional.          |

## Qué no está en esta spec

- Grabación, transcripción o resumen con IA.
- Flujos de aprobación, estados extra o integración con Ideas.
- Asignación a cuentas Forge, colaboración, invitaciones o notificaciones.
- Fechas límite en tickets.
- CLI o MCP para crear, editar o buscar reuniones.
- Calendarios, recurrencia, adjuntos o exportación de reuniones.

Cada elemento, si llega, requiere otra spec.

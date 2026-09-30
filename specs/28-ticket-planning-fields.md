# SPEC 28 — Complejidad y fechas de planificación en tickets

> **Estado:** Implementado  
> **Depende de:** SPEC 23 — Escritura de tickets en MCP · SPEC 26 — Reuniones y responsables de tickets (campo Responsable)  
> **Fecha:** 2026-09-28  
> **Objetivo:** Añadir a los tickets los campos opcionales Complejidad (Baja, Media, Alta), Start Date y Due Date, gestionables desde Web, CLI y MCP y visibles en las tarjetas y el detalle web.

## Scope

**Incluye:**

- Añadir `complexity`, `start_date` y `due_date` al modelo de tickets existente. Son opcionales y empiezan en `NULL` en tickets nuevos y existentes.
- Usar tres niveles cualitativos de complejidad: baja, media y alta.
- Guardar Start Date y Due Date como fechas con hora. Web las introduce y muestra en la zona local; CLI y MCP reciben ISO 8601 con offset. La persistencia normaliza los instantes a UTC.
- Permitir que Start Date sea igual o anterior a Due Date. Si una creación o actualización incumple el orden, se rechaza sin cambiar el ticket.
- Permitir editar y limpiar los campos desde Web, CLI y MCP. Omitir un campo en una actualización conserva su valor; limpiarlo requiere una acción explícita.
- Mostrar los tres campos en las tarjetas y el detalle web. Incluirlos en las operaciones de creación, consulta y actualización de CLI y MCP.
- Extender la migración, las RPCs y los tipos, schemas y servicios compartidos, conservando autenticación y controles de acceso actuales.
- Cubrir validación, persistencia y presentación con tests sin conectarse a InsForge real.

**Fuera de alcance (para specs futuras):**

- Añadir **Original estimate** o **Time spent**; el seguimiento de tiempo actual no cambia.
- Restaurar próximos pasos de Meetings ni integrarlos con tickets.
- Añadir filtros, orden, informes, notificaciones, recordatorios o vistas de calendario para estos campos.
- Actualizar SPEC 26 dentro de esta especificación; queda como tarea documental separada.

## Data model

La migración añade tres columnas opcionales a `public.dev_board_tickets`; los tickets existentes quedan con `NULL`.

```sql
ALTER TABLE public.dev_board_tickets
  ADD COLUMN start_date TIMESTAMPTZ NULL,
  ADD COLUMN due_date TIMESTAMPTZ NULL,
  ADD COLUMN complexity TEXT NULL
    CHECK (complexity IS NULL OR complexity IN ('low', 'medium', 'high')),
  ADD CONSTRAINT dev_board_tickets_date_order_check
    CHECK (start_date IS NULL OR due_date IS NULL OR start_date <= due_date);
```

Los tipos de Core y Web añaden:

```ts
export const COMPLEXITY_LEVELS = ["low", "medium", "high"] as const;
export type TicketComplexity = (typeof COMPLEXITY_LEVELS)[number];

type TicketPlanningFields = {
  startDate: string | null; // ISO 8601, normalizado a UTC al persistir
  dueDate: string | null; // ISO 8601, normalizado a UTC al persistir
  complexity: TicketComplexity | null;
};

// Ticket y TicketSummary incluyen TicketPlanningFields.
type TicketPlanningCreateInput = {
  startDate?: string;
  dueDate?: string;
  complexity?: TicketComplexity;
};
type TicketPlanningUpdateInput = TicketPlanningCreateInput & {
  clearStartDate?: boolean;
  clearDueDate?: boolean;
  clearComplexity?: boolean;
};
```

Las RPCs `create_dev_board_ticket` y `update_dev_board_ticket` reciben los nuevos campos. Los parámetros de creación son opcionales y parten de `NULL`. En actualización, los campos omitidos conservan el valor existente y los parámetros explícitos `p_clear_start_date`, `p_clear_due_date` y `p_clear_complexity` limpian el campo correspondiente. Ambas RPCs validan los valores de complejidad y el orden de fechas. La autenticación y autorización existentes se mantienen.

CLI y MCP aceptan fechas ISO 8601 con offset, por ejemplo `2026-09-28T21:29:00-06:00`. Web convierte la hora local introducida al instante correspondiente antes de persistirla.

## Implementation plan

### Group 1 — Persistencia y Core

- [x] **1.1** Crear una migración en `migrations/` con `start_date`, `due_date` y `complexity` opcionales, las restricciones de valores y orden de fechas, y extender las RPCs `create_dev_board_ticket` y `update_dev_board_ticket` de forma compatible.
- [x] **1.2** Extender `packages/forge-core/src/types.ts`, `ticket-schema.ts` y `dev-board-service.ts` para validar, leer, escribir y limpiar los campos, incluidos en `Ticket` y `TicketSummary`.
- [x] **1.3** Añadir tests en `packages/forge-core/tests/schemas/ticket-schema.test.ts` y `tests/services/dev-board-service.test.ts` para valores, fechas, compatibilidad y actualizaciones parciales.

### Group 2 — Web

- [x] **2.1** Extender tipos, schemas, mapeo de filas, servicio y acciones en `apps/web/src/features/dev-board/`; cubrir persistencia, zona local y validación con tests.
- [x] **2.2** Añadir los controles opcionales al formulario de creación y edición en `components/ticket-form.tsx`, con limpieza explícita y hora local.
- [x] **2.3** Mostrar complejidad y fechas en `components/ticket-card.tsx` y `components/ticket-detail-dialog.tsx`; cubrir su presentación con tests.

### Group 3 — CLI

- [x] **3.1** Extender `apps/cli/src/commands/ticket.ts` con flags de creación y actualización para los campos nuevos, fechas ISO 8601 con offset y flags `--clear-*`; añadir tests de comandos.
- [x] **3.2** Actualizar `apps/cli/src/format.ts` y sus tests para incluir los campos en las salidas de texto y JSON.
- [x] **3.3** Documentar flags, formatos y opciones de limpieza en `apps/cli/README.md`.

### Group 4 — MCP

- [x] **4.1** Extender `apps/mcp/src/tool-schemas.ts`, `tools.ts` e `index.ts` para incluir los campos en crear, consultar, listar y actualizar tickets, con limpieza explícita.
- [x] **4.2** Probar validación, lectura, escritura, conservación de campos omitidos y limpieza en `apps/mcp/tests/tool-schemas.test.ts` y `tests/tools.test.ts`.
- [x] **4.3** Documentar los argumentos y formatos en `apps/mcp/README.md`.

## Criterios de aceptación

- [ ] Una migración añade `start_date`, `due_date` y `complexity` como campos opcionales; los tickets existentes siguen cargando con esos campos en `NULL`.
- [ ] Crear un ticket desde Web, CLI o MCP sin indicar estos campos los deja vacíos.
- [ ] Complejidad acepta solo los niveles **baja**, **media** y **alta**; valores distintos se rechazan.
- [ ] Web permite introducir y mostrar las fechas con hora local; CLI y MCP aceptan fechas ISO 8601 con offset. Al recargar el ticket, se muestra la misma hora local.
- [ ] Start Date y Due Date pueden estar vacías; cuando ambas tienen valor, Start Date no es posterior a Due Date.
- [ ] Una fecha inválida rechaza la creación o actualización sin modificar parcialmente el ticket.
- [ ] Actualizar otros campos sin enviar Complejidad o fechas conserva sus valores; las acciones explícitas de limpieza los dejan en `NULL`.
- [ ] Las tarjetas y el detalle web muestran las fechas y el nivel de complejidad, y el formulario permite crear, editar y limpiar esos valores.
- [ ] CLI muestra los valores en salidas de texto y JSON, acepta los flags de alta/edición y limpia campos mediante `--clear-*`.
- [ ] MCP incluye los campos al crear, listar, consultar y actualizar tickets, y permite limpiarlos con `clear*`.
- [ ] Las RPCs conservan la autenticación y autorización existentes; los clientes que omiten los campos nuevos siguen funcionando.
- [ ] Los tests de Core, Web, CLI y MCP cubren validación, fechas, lectura, escritura y limpieza sin usar InsForge real.
- [ ] `pnpm test`, `pnpm build`, `pnpm lint` y `pnpm --filter @forge/mcp typecheck` pasan.
- [ ] Una revisión manual confirma la creación, edición, presentación y limpieza de los campos en Web.
- [ ] No se añade **Original estimate**, **Time spent** ni se restaura la conversión de próximos pasos de Meetings.

## Decisiones

- **Sí:** Mantener los tres campos solicitados —Complejidad, Start Date y Due Date— y excluir Original estimate y Time spent.
- **Sí:** Complejidad será cualitativa: baja, media o alta; no se usará un número ni tallas XS–XL.
- **Sí:** Las fechas incluirán hora; Web las mostrará en la zona local y CLI/MCP requerirán ISO 8601 con offset.
- **Sí:** Los campos serán opcionales y empezarán vacíos. Las actualizaciones conservarán los campos omitidos y usarán acciones explícitas para limpiarlos.
- **Sí:** Si Start Date supera Due Date, se rechazará la operación sin modificar el ticket.
- **Sí:** Complejidad y fechas se mostrarán en las tarjetas y el detalle web, y estarán disponibles en Web, CLI y MCP.
- **Sí:** Mantener todo en una sola spec amplia, aunque cruza migración, Core, Web, CLI y MCP, como eligió el usuario.
- **No:** Restaurar los próximos pasos de Meetings ni integrarlos con Due Date; el esquema actual ya los eliminó.
- **No:** Añadir filtros, reportes, recordatorios, calendario u otras funciones de planificación.
- **Separado:** Actualizar SPEC 26 es una tarea documental aparte; no se modifica como parte de esta spec.

## Riesgos

| Riesgo                                                                                                                                     | Mitigación                                                                                                              |
| ------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| Una conversión incorrecta entre hora local y UTC altera la hora al guardar o mostrar una fecha, especialmente cerca de cambios de horario. | Exigir offset en CLI/MCP y probar conversión, persistencia y lectura con distintos offsets.                             |
| Extender las RPCs podría romper clientes existentes.                                                                                       | Mantener opcionales los nuevos parámetros y verificar que clientes que los omiten sigan creando y actualizando tickets. |
| Web, Core, CLI y MCP podrían validar niveles o fechas de manera distinta.                                                                  | Mantener un único contrato de complejidad y probar valores, orden de fechas y limpieza en cada superficie.              |
| Una actualización parcial podría borrar datos que no pretendía cambiar el usuario.                                                         | Preservar campos omitidos y cubrir las acciones explícitas de limpieza con tests.                                       |

## Qué no está en esta spec

- Añadir **Original estimate** o **Time spent**.
- Restaurar próximos pasos de Meetings ni copiar fechas de reuniones a tickets.
- Añadir filtros, reportes, notificaciones, recordatorios o calendario para los campos nuevos.
- Actualizar el documento SPEC 26; esa corrección se realizará por separado.

# SPEC 22 — Estados, búsqueda y filtros de proyectos

> **Estado:** Aprobado
> **Depende de:** SPEC 04 — Proyectos en Dev Board
> **Fecha:** 2026-09-23
> **Objetivo:** Añadir estados manuales, búsqueda y filtros en una tabla web adaptable para organizar proyectos del Dev Board.

## Alcance

**Incluye:**

- Añadir estados manuales `planned`, `in_progress`, `paused`, `completed` y `archived`.
- Asignar `planned` a proyectos nuevos y existentes.
- Rediseñar `/dev-board` como tabla adaptable con componentes shadcn/ui. Mostrar nombre, descripción, estado, fecha de creación y acciones.
- Buscar por nombre y descripción. Filtrar por estado. Guardar búsqueda, filtro y orden en la URL.
- Orden inicial: proyectos `in_progress` primero; luego `planned`, `paused` y `completed`; dentro de cada estado, los más recientes primero. Permitir ordenar por nombre o fecha.
- Ocultar proyectos `archived` inicialmente. Permitir encontrarlos con el filtro de estado y seguir editándolos.
- Cambiar estado desde la tabla y desde los formularios de creación y edición. Mostrar estado actual en el board del proyecto.
- Mostrar lista completa, sin paginación. Aplicar cambios solo a la web; mantener controles de acceso actuales.

**Fuera de alcance (para specs futuras):**

- Gestión, búsqueda y filtros de estado desde CLI o MCP.
- Estados personalizados o reglas automáticas basadas en tickets.
- Impedir que varios proyectos estén `in_progress`.
- Etiquetas, agrupación en columnas y cambios en analytics.

## Modelo de datos

La migración añade estado persistente a `public.dev_board_projects`. El valor por defecto asigna `planned` a proyectos nuevos y existentes.

```sql
ALTER TABLE public.dev_board_projects
  ADD COLUMN status TEXT NOT NULL DEFAULT 'planned'
  CHECK (status IN ('planned', 'in_progress', 'paused', 'completed', 'archived'));
```

Modelo web:

```ts
export const PROJECT_STATUSES = [
  "planned",
  "in_progress",
  "paused",
  "completed",
  "archived",
] as const;

export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  createdAt: string;
}

export interface ProjectCreateInput {
  name: string;
  description: string;
  status: ProjectStatus;
}

export type ProjectUpdateInput = Partial<ProjectCreateInput>;
```

- Los estados se guardan en minúsculas con `_` en valores compuestos.
- La migración conserva RLS y permisos actuales.
- La búsqueda, filtro y orden se guardan en la URL, no en una tabla nueva.

## Plan de implementación

### Grupo 1 — Persistencia y edición de estados

- [x] 1.1 Crear `migrations/20260923230000_dev-board-project-status.sql` con columna `status`, valor por defecto `planned` y restricción para los cinco estados.
- [x] 1.2 Añadir `PROJECT_STATUSES`, `ProjectStatus` y `status` a tipos de proyecto; validar estado en `apps/web/src/features/dev-board/schemas/project.ts` y cubrir valores válidos e inválidos en `schemas/project.test.ts`.
- [x] 1.3 Leer y escribir `status` en `apps/web/src/features/dev-board/services/projects-service.ts`; incluirlo en validación de `actions.ts` y verificar mapeo y persistencia con pruebas del servicio.
- [x] 1.4 Añadir selector de estado a `apps/web/src/features/dev-board/components/project-form.tsx`; comprobar que creación usa `planned` por defecto y edición conserva y guarda estado seleccionado.

### Grupo 2 — Búsqueda y tabla de proyectos

- [x] 2.1 Crear `apps/web/src/features/dev-board/schemas/project-filters.ts` para analizar `q`, `status` y `sort`; probar valores por defecto y parámetros inválidos.
- [x] 2.2 Conectar `searchParams` de `/dev-board` con filtros y orden; excluir `archived` por defecto y ordenar por estado y fecha descendente.
- [x] 2.3 Crear `apps/web/src/features/dev-board/components/project-list-toolbar.tsx` con búsqueda, filtro de estado y orden; conservar los controles en URL y probar navegación y recarga.
- [x] 2.4 Reemplazar tarjetas de `apps/web/src/features/dev-board/components/project-list.tsx` por tabla shadcn/ui adaptable; mantener acciones y estado vacío, y permitir editar estado desde cada fila.
- [x] 2.5 Añadir filas compactas para móvil y estado vacío para búsquedas sin resultados; probar tabla, filtro de archivados y orden por nombre o fecha.

### Grupo 3 — Integración con board

- [x] 3.1 Mostrar badge con estado actual en cabecera de `apps/web/src/features/dev-board/components/project-board.tsx`; comprobar representación de los cinco estados.
- [x] 3.2 Probar cambios de estado desde formulario y tabla, y verificar que el estado visible en board coincide tras guardar.

## Criterios de aceptación

**Datos**

- [ ] `dev_board_projects.status` acepta solo los cinco estados y tiene valor por defecto `planned`; proyectos existentes quedan en `planned`.
- [ ] Crear o actualizar estado inválido falla; políticas RLS y protección de borrado con tickets siguen vigentes.

**Web**

- [x] `/dev-board` muestra nombre, descripción, estado, fecha de creación y acciones en tabla adaptable; móvil muestra filas compactas.
- [x] Buscar por nombre o descripción filtra proyectos. Búsqueda, estado y orden aparecen en la URL y se restauran al recargar o navegar atrás.
- [x] Sin filtro explícito, `archived` no aparece. Al filtrar por `archived`, proyectos archivados aparecen y siguen editables.
- [x] Orden inicial es `in_progress`, `planned`, `paused`, `completed`; dentro de cada estado, fecha de creación descendente. Orden por nombre o fecha también funciona.
- [x] Crear proyecto usa `planned` inicialmente; formulario y tabla permiten cambiar estado y guardarlo.
- [x] Board muestra estado actual del proyecto. Varios proyectos pueden estar `in_progress`.
- [x] Listado muestra todos los proyectos coincidentes sin paginación; búsqueda sin coincidencias muestra estado vacío recuperable.

**Verificación**

- [x] Tests del feature Dev Board pasan con `pnpm --filter @forge/web exec vitest run --config tests.config.ts src/features/dev-board`.
- [x] `pnpm build:web` y `pnpm lint` pasan.
- [ ] Smoke manual confirma migración, búsqueda, filtros, orden, edición de estado y persistencia tras recargar.

## Decisiones

- **Sí:** Estados fijos (`planned`, `in_progress`, `paused`, `completed`, `archived`) guardados en DB. Rechazados estados personalizables para limitar configuración.
- **Sí:** El usuario cambia estado manualmente; varios proyectos pueden estar `in_progress`. Rechazado derivar estado desde tickets, que no refleja intención personal.
- **Sí:** Proyectos nuevos y existentes empiezan `planned`. Rechazado inferir estado de proyectos existentes porque datos de tickets no prueban estado actual.
- **Sí:** `archived` se oculta inicialmente en la web, pero sigue editable y accesible con filtro. CLI y MCP conservan comportamiento actual.
- **Sí:** SPEC 22 cubre modelo y web; CLI y MCP van en spec separada para mantener grupos revisables.
- **Sí:** Tabla adaptable, filtros y orden en URL, listado completo sin paginación. Rechazadas vista por columnas y persistencia local adicional.

## Riesgos

| Riesgo                                                                 | Mitigación                                                                                                                               |
| ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `archived` oculto puede confundirse con borrado.                       | Ofrecer filtro `Archived`; mantener accesible board y edición.                                                                           |
| Parámetros URL inválidos pueden producir filtros inesperados.          | Validar estados y orden permitidos; usar valores por defecto ante valores inválidos.                                                     |
| La lista de estados puede divergir entre la restricción de DB y la UI. | Mantener los mismos valores en `PROJECT_STATUSES` y en la restricción; verificar estados aceptados y rechazados en la migración y la UI. |

## Qué **no** está en esta spec

- Cambios de estados, búsqueda o filtros en CLI y MCP. Van en una spec separada.
- Estados personalizables, estado derivado de tickets o límite de un proyecto `in_progress`.
- Tags para proyectos.
- Vista de proyectos agrupados en columnas.
- Cambios en analytics.

Cada cambio futuro requiere su propia spec.

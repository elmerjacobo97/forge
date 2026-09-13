# SPEC 21 — Ideas: captura y seguimiento de ideas

> **Estado:** Implementado
> **Depende de:** SPEC 08 — Resources (patrón de tool CRUD, filtros y tarjetas) · SPEC 02 — CLI Bookmarks (patrón de comandos CRUD sobre `@forge/core`)
> **Fecha:** 2026-09-12
> **Objetivo:** Añadir el tool `Ideas` (web en `/ideas` y CLI `forge-cli idea`) para capturar ideas con título, contenido, estado, categoría, tags y enlaces, con CRUD completo, búsqueda y filtros, persistido en InsForge con RLS por usuario.

## Alcance

**Incluye:**

- Tool visible `Ideas` en el sidebar bajo la categoría `Productivity`, ruta autenticada `/ideas`, registrado en `tools.ts` y en `proxy.ts`.
- Migración `public.ideas` con índice `(user_id, created_at DESC)`, triggers `updated_at` y `prevent_user_id_change`, 4 políticas RLS y grant a `authenticated` (mismo patrón que `resources`).
- Modelo de idea: `title`, `content`, `status` (`seed | exploring | building | parked | shipped`), `category` (`app | web | mobile | business | other`), `tags: string[]` y `links: string[]`.
- Lista compacta: una fila por idea con título, badge de estado, categoría, tags, indicador de enlaces y fecha; el contenido completo se ve en el diálogo de edición.
- Dialogs de alta, edición y eliminación con confirmación; en alta, `status` default `seed` y `category` default `other`.
- Búsqueda por título, contenido y tags; filtros de estado, categoría y tag persistidos en la URL; paginación con `ListPagination` (mismo patrón que Resources).
- Estados de carga, error y vacío por ruta (`loading.tsx`/`error.tsx` ya existentes del grupo autenticado).
- Capa core en `@forge/core`: constantes `IDEA_STATUSES`/`IDEA_CATEGORIES`, tipos `Idea`/`IdeaCreateInput`/`IdeaUpdateInput`, `idea-schema.ts` con zod y `parseIdeaCreateInput`/`parseIdeaUpdateInput`, `ideas-service.ts` con `createIdeasService` (list, get, create, update, delete) y exports en `index.ts`.
- CLI: `forge-cli idea create|list|get|update|delete` con `--title`, `--content`, `--status`, `--category`, `--tags`, `--links`, `--limit`, `--offset`, `--json`; salida texto/JSON y errores con exit 1, espejo de `resource`.
- Tests: core (schema y service con mock), web (service, filtros y toolbar), CLI (formato de salida); `pnpm build` y `pnpm lint` en verde; smoke manual web + CLI.
- Docs: `README.md` raíz, `apps/cli/README.md`, `docs/product.md` y `docs/ROADMAP.md`.

**Fuera de alcance (para specs futuras):**

- IA sobre ideas (expandir una frase cruda, sugerir tags o pitch): el tipo `idea` en `/api/ai-content` queda para otra spec.
- MCP: el contrato read-only de SPEC 18 no se toca y las ideas no se exponen.
- Release npm del CLI (bump, tag, publish): ticket aparte.
- Relación con Dev Board (promover una idea a proyecto o ticket) y cualquier sincronización.
- Vista tablero por estado con drag & drop.
- Markdown renderizado del contenido: v1 guarda y muestra texto plano.
- Adjuntos, imágenes o archivos.
- Estado `Archived` y borrado lógico: eliminar es definitivo con confirmación.
- Compartir, equipos o enlaces públicos.
- Import/export de ideas, notificaciones y recordatorios.
- Cambios en Bookmarks, Resources o cualquier otro tool.

## Modelo de datos

Tabla nueva `public.ideas` (no hay RPC; CRUD directo sobre la tabla, como `resources`):

```sql
CREATE TABLE public.ideas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 200),
  content TEXT NOT NULL CHECK (char_length(content) <= 100000),
  status TEXT NOT NULL DEFAULT 'seed'
    CHECK (status IN ('seed', 'exploring', 'building', 'parked', 'shipped')),
  category TEXT NOT NULL DEFAULT 'other'
    CHECK (category IN ('app', 'web', 'mobile', 'business', 'other')),
  tags TEXT[] NOT NULL DEFAULT '{}',
  links TEXT[] NOT NULL DEFAULT '{}'
    CHECK (array_length(links, 1) IS NULL OR array_length(links, 1) <= 10),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ideas_user_id_created_at_idx ON public.ideas (user_id, created_at DESC);
```

Además: trigger `ideas_updated_at` (`system.update_updated_at()`), trigger `ideas_prevent_user_change` (`public.prevent_user_id_change()`), RLS habilitado con 4 políticas `*_own` (`user_id = (SELECT auth.uid())`) y `GRANT SELECT, INSERT, UPDATE, DELETE ON public.ideas TO authenticated`.

Tipos en `@forge/core` (`types.ts`):

```ts
export const IDEA_STATUSES = ["seed", "exploring", "building", "parked", "shipped"] as const;
export const IDEA_CATEGORIES = ["app", "web", "mobile", "business", "other"] as const;

export type IdeaStatus = (typeof IDEA_STATUSES)[number];
export type IdeaCategory = (typeof IDEA_CATEGORIES)[number];

export interface Idea {
  id: string;
  title: string;
  content: string;
  status: IdeaStatus;
  category: IdeaCategory;
  tags: string[];
  links: string[];
  createdAt: string;
}

export interface IdeaCreateInput {
  title: string;
  content: string;
  status: IdeaStatus;
  category: IdeaCategory;
  tags: string[];
  links: string[];
}

export type IdeaUpdateInput = Partial<IdeaCreateInput>;
```

La capa web (`features/ideas/types`) replica `Idea`, `IdeaStatus` y `IdeaCategory` en camelCase.

Reglas:

- `title`: trim, mínimo 2, máximo 200; el check SQL `1..200` replica el patrón de `resources` (DB tolerante, zod estricto).
- `content`: mínimo 1, máximo 100 000; texto plano, sin markdown renderizado en v1.
- `status` default `seed` y `category` default `other`; ambos obligatorios en formularios y validados contra los enums importados de `@forge/core`.
- `tags`: minúsculas, sin duplicados, trim; `[]` permitido; sin tope (igual que `resources`).
- `links`: URLs absolutas validadas con `z.url()`, máximo 10, sin duplicados, trim; `[]` permitido. Se persisten tal cual, sin normalizar host.
- CLI: `--links https://a.com,https://b.com` separados por coma (espejo de `--tags`); `--links ""` limpia el array en `update`.
- `updated_at` queda como auditoría en DB; no se selecciona ni se expone en los tipos (igual que `resources`).
- Orden del listado: `created_at DESC, id DESC` con desempate por `id` (mismo criterio que Resources y el fix de tickets recientes).

## Plan de implementación

Cada paso deja el sistema en estado funcional y verificable.

1. **Migración.** Crear `migrations/<timestamp>_ideas.sql` con la tabla `public.ideas`, índice, triggers, RLS y grant (patrón de `migrations/20260720140338_initial-forge-schema.sql`). Aplicar con `npx @insforge/cli db migrations up --to <timestamp>` y smoke SQL: insert/select/delete con la sesión propia.
2. **Core tipos y schema.** En `packages/forge-core/src/types.ts`: `IDEA_STATUSES`, `IDEA_CATEGORIES`, `Idea`, `IdeaCreateInput`, `IdeaUpdateInput`. Crear `packages/forge-core/src/idea-schema.ts`: `ideaCreateSchema` (defaults `seed`/`other`, title min 2, content min 1, tags, links con `z.url()` y tope 10), `ideaUpdateSchema` (partial + al menos un campo) y `parseIdeaCreateInput`/`parseIdeaUpdateInput`; `formatZodError` se importa de `./bookmark-schema.js` como en `project-schema.ts:2`. Tests en `packages/forge-core/tests/schemas/idea-schema.test.ts`. Exportar en `index.ts`.
3. **Core service.** Crear `packages/forge-core/src/ideas-service.ts` con `createIdeasService({ client })` espejo de `resources-service.ts` (`TABLE = "ideas"`, `COLUMNS`, `mapRowToIdea`, `toIdeaPayload`, `list/get/create/update/delete`; errores `Idea not found.` y `Nothing to update. Provide at least one field.`). Tests en `packages/forge-core/tests/services/ideas-service.test.ts` con el mock existente de InsForge. Exportar en `index.ts`.
4. **CLI.** Crear `apps/cli/src/commands/idea.ts` (`IDEA_HELP`, `runCreate/List/Get/Update/Delete`, dispatcher) espejo de `commands/resource.ts`; `createAuthedIdeasService` en `apps/cli/src/insforge.ts`; registrar import, help y case `idea` en `apps/cli/src/main.ts`; formatters `formatIdea*`/`writeIdea*` en `apps/cli/src/format.ts`; casos de ideas en `apps/cli/tests/lib/format.test.ts`; sección Ideas en `apps/cli/README.md`.
5. **Web capa de datos.** Crear `apps/web/src/features/ideas/`: `types/index.ts`, `constants/index.tsx` (opciones con labels), `schemas/idea-schema.ts`, `schemas/idea-filters.ts` (`parseIdeaFilters` para `status`, `category`, `tag`, `q`), `utils/query-filters.ts` (+ test), `services/ideas-service.ts` (+ test, `fetchIdeasPage` con count exacto y create/update/delete) y `actions.ts` (re-validación de sesión, zod, `revalidatePath("/ideas")`).
6. **Web UI.** Crear `apps/web/src/app/(authenticated)/ideas/page.tsx` (server component, `PageProps<"/ideas">`, filtros y `visible`); componentes `ideas.tsx` (lista compacta + empty state + `ListPagination`), `ideas-toolbar.tsx` (+ test, reusa `useUrlSearch`), `idea-row.tsx`, `add-idea-dialog.tsx`, `edit-idea-dialog.tsx`, `delete-idea-dialog.tsx` y `idea-form-fields.tsx`. Registrar el tool en `apps/web/src/lib/tools.ts` (id `ideas`, ruta `/ideas`, icono `Lightbulb`, categoría `Productivity`) y añadir `/ideas` a `protectedPathPrefixes` en `apps/web/src/proxy.ts`.
7. **Docs.** Actualizar `README.md` (lista de tools y ejemplo CLI), `docs/product.md` (superficies con datos y CLI), `docs/ROADMAP.md` (14 → 15 tools activas) y `docs/IDEAS.md` (Idea capture pasa a "Ya hecho" al cerrar la spec).
8. **Verificación.** `pnpm test:core`, `pnpm test:cli`, `pnpm --filter @forge/web exec vitest run --config tests.config.ts src/features/ideas`, `pnpm build`, `pnpm lint` y Prettier sobre archivos tocados. Smoke manual: crear, editar, filtrar y eliminar una idea en `/ideas`; crear y listar por CLI; confirmar que otra cuenta no ve las ideas (RLS).

## Criterios de aceptación

**Datos**

- [ ] La tabla `public.ideas` existe con índice `(user_id, created_at DESC)`, triggers `updated_at` y `prevent_user_id_change`, RLS habilitado y grant a `authenticated`.
- [ ] Un smoke SQL con la sesión propia puede insertar, leer y eliminar una idea.
- [ ] Una segunda cuenta no ve ni modifica ideas ajenas (RLS).

**Core**

- [ ] `parseIdeaCreateInput` aplica defaults `seed`/`other` y acepta tags/links vacíos.
- [ ] Rechaza título menor a 2, contenido vacío, más de 10 links, links que no son URL y status/category fuera del enum, con mensaje que lista los valores válidos.
- [ ] `parseIdeaUpdateInput` rechaza un payload sin campos.
- [ ] Tests de schema y service pasan con Vitest (`pnpm test:core`).

**CLI**

- [ ] `forge-cli idea create --title "..." --content "..."` crea con defaults y emite texto; con `--json` emite JSON limpio en stdout.
- [ ] `--status`, `--category`, `--tags` y `--links` persisten los valores; `--links ""` en `update` limpia el array.
- [ ] `--status bogus` sale con exit 1 y un mensaje que lista `seed | exploring | building | parked | shipped`.
- [ ] `forge-cli idea list|get|update|delete` funcionan; `get` de un id inexistente devuelve `Idea not found.` con exit 1; errores van a stderr como `{"error":{"message":"..."}}`.
- [ ] Casos de ideas en `tests/lib/format.test.ts` pasan (`pnpm test:cli`).

**Web**

- [ ] `/ideas` exige sesión (redirige si no hay) y aparece en sidebar, command palette y header con nombre `Ideas`, icono `Lightbulb` y descripción.
- [ ] Crear una idea desde el diálogo guarda defaults `seed`/`other` y la fila aparece en la lista.
- [ ] La lista compacta muestra título, badge de estado, categoría, tags, indicador de enlaces y fecha; el contenido completo se ve en el diálogo de edición.
- [ ] La búsqueda encuentra por título, contenido y tags.
- [ ] Los filtros de estado, categoría y tag viven en la URL: recargar o compartir el enlace conserva el filtro; `ListPagination` carga más resultados.
- [ ] Editar y eliminar (con confirmación) persisten en InsForge y refrescan la lista.
- [ ] Los estados vacío, de carga y de error de la ruta se muestran correctamente.
- [ ] Tests de web del feature pasan con Vitest y `tests.config.ts`.

**Cierre**

- [ ] `pnpm build` y `pnpm lint` terminan sin errores; Prettier aplicado solo a archivos tocados.
- [ ] `README.md`, `apps/cli/README.md`, `docs/product.md`, `docs/ROADMAP.md` y `docs/IDEAS.md` documentan el tool y el comando; ROADMAP reporta 15 tools activas.
- [ ] Smoke manual extremo a extremo: crear, buscar, filtrar, editar y eliminar en `/ideas`, y listar la misma idea por CLI.

## Decisiones

- **Sí:** tool independiente `Ideas` con tabla propia, no un `kind` de Resources; el ciclo de vida (estado) y la captura rápida no encajan con los recursos técnicos.
- **Sí:** ruta `/ideas` bajo la categoría `Productivity`, con tabla, core, CLI y docs completos desde v1.
- **Sí:** título y contenido obligatorios (min 2 y min 1); evita ideas vacías y mantiene la búsqueda útil.
- **Sí:** estados `seed | exploring | building | parked | shipped` y categorías `app | web | mobile | business | other`, con defaults `seed` y `other`; UI en inglés como el resto de la app.
- **Sí:** lista compacta (una fila por idea) en lugar de grid de tarjetas; prioriza escanear muchas ideas. El contenido completo vive en el diálogo de edición.
- **Sí:** varios enlaces por idea (máximo 10, `z.url()`), con `--links a,b` en CLI; un solo campo no cubría inspiración + competidor + doc.
- **Sí:** búsqueda y filtros en la URL reusando `useUrlSearch`, `parseIdeaFilters` y `ListPagination` de Resources; cero mecanismos nuevos.
- **Sí:** borrado definitivo con confirmación; no hay estado `Archived` ni borrado lógico en v1.
- **Sí:** lógica compartida en `@forge/core` y comando CLI `forge-cli idea` en singular, espejo de `resource`.
- **Sí:** persistencia exclusiva en InsForge con RLS por usuario y contenido en texto plano.
- **No:** IA sobre ideas; el tipo `idea` en `/api/ai-content` queda para otra spec.
- **No:** exponer ideas en MCP; el contrato read-only de SPEC 18 se mantiene.
- **No:** relación con Dev Board (promover idea a proyecto o ticket) en v1.
- **No:** vista tablero por estado con drag & drop.
- **No:** release npm del CLI (bump, tag, publish) en esta spec.
- **No:** markdown renderizado, adjuntos, compartir/equipos, import/export, notificaciones ni recordatorios.
- **No:** cambios en Bookmarks, Resources u otros tools.

## Riesgos

| Riesgo                                                                | Mitigación                                                                                                            |
| --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Un link inválido o el exceso de 10 links rompe la creación desde CLI. | Validación zod compartida en `@forge/core` (web y CLI); el CHECK SQL del tope actúa como red de seguridad.            |
| Deriva entre estados/categorías de CLI, web y DB.                     | Enums importados de `@forge/core` en zod y help; el CHECK SQL espeja la lista.                                        |
| La búsqueda `or/ilike` sobre contenido y tags degrada con volumen.    | Mismo patrón ya usado por Resources; búsqueda server-side indexada queda para una spec futura si el volumen lo pide.  |
| La lista compacta oculta contenido que el usuario esperaba ver.       | Título + badges son el ancla; el diálogo de edición muestra el contenido completo.                                    |
| La migración en producción aplica RLS o triggers incorrectos.         | Reusar el DDL ya probado de `resources`; smoke SQL antes de conectar web y CLI.                                       |
| Deriva de mapeos snake_case entre core, web y CLI.                    | Web reusa `parseIdea*` de core; el service web replica el row schema zod de Resources y tiene tests propios.          |
| Ideas se percibe como duplicado de las notas de Resources.            | Decisión de producto documentada: Ideas = conceptos con ciclo de vida; Resources = artefactos técnicos reutilizables. |

## Qué **no** está en esta spec

- IA sobre ideas (tipo `idea` en `/api/ai-content`).
- MCP: las ideas no se exponen y el contrato read-only de SPEC 18 no cambia.
- Release npm del CLI.
- Relación con Dev Board (promover idea a proyecto o ticket).
- Vista tablero por estado con drag & drop.
- Markdown renderizado, adjuntos o archivos.
- Estado `Archived` y borrado lógico.
- Compartir, equipos o enlaces públicos.
- Import/export, notificaciones o recordatorios.
- Cambios en Bookmarks, Resources u otros tools.

Cada elemento futuro deberá definirse en su propia spec.

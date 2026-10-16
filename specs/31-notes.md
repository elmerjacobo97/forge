# SPEC 31 — Notes: base de conocimiento personal

> **Estado:** Approved
> **Depende de:** SPEC 04 — Proyectos del Dev Board · SPEC 18 — Servidor MCP remoto · SPEC 21 — Ideas · SPEC 30 — CRUD de resources en el MCP
> **Fecha:** 2026-10-16
> **Objetivo:** Añadir la tool Notes: notas en markdown con tags y proyecto opcional, que el agente escribe y busca por MCP y CLI, y que tú lees y editas en la web.

## Alcance

**Incluye:**

- Tabla `public.notes` con RLS por usuario, migración en `migrations/`.
- Servicio `createNotesService` en `packages/forge-core` (list con búsqueda y filtros, get, create, update, delete), con schemas Zod y tipos exportados.
- Tool web `/notes` en `apps/web/src/features/notes/`: lista, búsqueda, filtros por tag y proyecto, diálogos de alta, edición y borrado. Entrada en `apps/web/src/lib/tools.ts` (sidebar y command palette).
- Contenido en markdown, mostrado renderizado en la tarjeta o detalle.
- Búsqueda `ilike` en título, contenido y tags.
- Proyecto opcional por FK a `dev_board_projects`, `ON DELETE SET NULL`.
- Cinco tools en el MCP remoto: `forge_list_notes`, `forge_get_note`, `forge_create_note`, `forge_update_note`, `forge_delete_note`.
- Comando `forge-cli note` (list, get, add, update, delete) en `apps/cli`.
- Skill `forge-notes` con cuándo guardar, cuándo buscar y cómo escribir una nota útil.
- Tests en core, web, CLI y MCP; docs en `apps/mcp/README.md`.

**Fuera de alcance (specs futuras):**

- Notas de despliegue: se registran como tickets del Dev Board.
- Lectura automática de notas en `forge_next_ticket` o al mover tickets.
- Campos estructurados (`kind`, `library`, `version`); la versión va como tag.
- Búsqueda full-text, ranking o embeddings.
- Adjuntos, imágenes, importar o exportar.
- Compartir notas o espacios de equipo.
- Historial de versiones de una nota.
- Detectar notas duplicadas.
- Relación con tickets individuales (solo proyecto).

## Modelo de datos

Migración nueva: `migrations/<timestamp>_notes.sql`.

```sql
CREATE TABLE public.notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID NULL REFERENCES public.dev_board_projects(id) ON DELETE SET NULL,
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 2 AND 200),
  content TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 100000),
  tags TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

Igual que `ideas`: índice `(user_id, created_at DESC)`, índice `(user_id, project_id)`, triggers `notes_updated_at` y `notes_prevent_user_change`, RLS con cuatro políticas `notes_*_own` y `GRANT` a `authenticated`.

Tipos en `packages/forge-core/src/types.ts`:

```ts
type Note = {
  id: string;
  title: string;
  content: string; // markdown
  tags: string[];
  projectId: string | null;
  createdAt: string;
  updatedAt: string;
};

type NoteCreateInput = {
  title: string;
  content: string;
  tags: string[]; // default []
  projectId?: string | null;
};

type NoteUpdateInput = Partial<NoteCreateInput>; // al menos un campo

type NoteListOptions = ListOptions & {
  q?: string; // ilike en title, content y tags
  tag?: string; // filtro exacto, uno solo
  projectId?: string; // solo notas de ese proyecto
};
```

Reglas:

- `title`: mínimo 2, máximo 200. `content`: mínimo 1, máximo 100000.
- Tags: trim, minúsculas, sin vacíos ni duplicados (`normalizeTags` como en ideas).
- `projectId` debe ser un UUID de un proyecto del usuario. `null` desvincula la nota.
- `list` ordena por `created_at` desc. `q` busca con `ilike %q%` en `title`, `content` y tags unidos. `tag` y `projectId` se combinan con `q` en AND.
- `update` exige al menos un campo. En MCP y CLI, `tags` reemplaza el array; `addTags` y `removeTags` ajustan (mismo criterio que SPEC 30). `tags` no se combina con ellos.
- Borrar un proyecto deja sus notas con `projectId: null`.

## Plan de implementación

### Grupo 1 — Migración y core

- [x] 1.1 Crear `migrations/<timestamp>_notes.sql`: tabla `notes`, índices, triggers, RLS y `GRANT`, calcado de `20260912232323_ideas.sql`.
- [x] 1.2 Añadir en `packages/forge-core/src/types.ts` `Note`, `NoteCreateInput`, `NoteUpdateInput` y `NoteListOptions`.
- [x] 1.3 Crear `packages/forge-core/src/note-schema.ts` con `noteCreateSchema`, `noteUpdateSchema` y los parsers. Reusar `normalizeTags` de `idea-schema.ts` (moverlo a `schema-utils.ts` si hace falta, sin duplicarlo).
- [x] 1.4 Crear `packages/forge-core/src/notes-service.ts` con `createNotesService` (`list`, `get`, `create`, `update`, `delete`). `list` aplica `q`, `tag`, `projectId`, `limit` y `offset`. Exportar en `index.ts`.
- [x] 1.5 Tests en `packages/forge-core/tests/` para schema y servicio: filtros, `q` en título, contenido y tags, `projectId: null`, update sin campos.

### Grupo 2 — Web

- [x] 2.1 Crear `apps/web/src/features/notes/` (`components/`, `schemas/`, `services/`, `utils/`, `actions.ts`, `notes.tsx`) siguiendo `features/ideas/`.
- [x] 2.2 Server Actions de crear, editar y borrar en `actions.ts`, con revalidación como en ideas.
- [x] 2.3 Rutas `apps/web/src/app/(authenticated)/notes/` (`page.tsx`, `loading.tsx`, `error.tsx`). Filtros `q`, `tag` y `project` en `searchParams`, parseados como `idea-filters.ts`.
- [x] 2.4 Componentes: toolbar con búsqueda y filtros, fila o tarjeta con markdown renderizado, diálogos `add`, `edit` y `delete`, selector de proyecto opcional.
- [x] 2.5 Registrar la tool en `apps/web/src/lib/tools.ts`.
- [x] 2.6 Tests colocados: filtros, toolbar y formulario.

### Grupo 3 — MCP

- [x] 3.1 Añadir `notes: createNotesService({ client })` en `apps/mcp/src/services.ts` y extender `apps/mcp/tests/helpers/mock-services.ts`.
- [x] 3.2 Schemas en `apps/mcp/src/tool-schemas.ts`: list (`limit`, `offset`, `q`, `tag`, `projectId`), `noteId`, create y update (con `addTags` y `removeTags`).
- [x] 3.3 Handlers en `apps/mcp/src/tools.ts` y registro en `apps/mcp/src/index.ts`: `forge_list_notes`, `forge_get_note`, `forge_create_note`, `forge_update_note`, `forge_delete_note`. Errores por `toToolError`.
- [x] 3.4 Tests en `apps/mcp/tests/` y las cinco filas en `apps/mcp/README.md`.

### Grupo 4 — CLI

- [x] 4.1 Crear `apps/cli/src/commands/note.ts` (`list`, `get`, `add`, `update`, `delete`) calcado de `idea.ts`. Flags `--title`, `--content`, `--tag`, `--project-id`, `--q`.
- [x] 4.2 Añadir `formatNoteText`, `formatNoteListText` y sus variantes JSON en `apps/cli/src/format.ts`.
- [x] 4.3 Registrar `note` en `apps/cli/src/main.ts` y en su ayuda.
- [x] 4.4 Tests en `apps/cli/tests/lib/format.test.ts`.

### Grupo 5 — Skill y docs

- [ ] 5.1 Crear `skills/forge/forge-notes/SKILL.md`: cuándo guardar (la doc oficial no sirvió, config que funcionó, decisión tomada), cuándo buscar antes de empezar, cómo escribir título, contenido y tags, y la regla de no pedir `project-id` si la nota es global.
- [ ] 5.2 Actualizar `docs/ROADMAP.md` (Tools activas: 7), `docs/IDEAS.md` (Notes como hecho) y el `README` del CLI si lista comandos.
- [ ] 5.3 Correr `pnpm lint`, `pnpm test` y `pnpm build`.

## Criterios de aceptación

- [ ] La migración crea `public.notes` con RLS. Un usuario no ve, edita ni borra notas de otro.
- [ ] Borrar un proyecto deja sus notas con `project_id` en `NULL` y no las elimina.
- [ ] `title` de 1 carácter, `content` vacío y `projectId` que no es UUID fallan en el schema y no llaman al servicio.
- [ ] Tags: se guardan en minúsculas, sin vacíos ni duplicados.
- [ ] `list` devuelve `Note[]` por `created_at` desc. `q` encuentra por título, contenido y tag. `tag` y `projectId` filtran. Combinados aplican en AND.
- [ ] `/notes` aparece en el sidebar y en la command palette. Redirige a login sin sesión.
- [ ] En `/notes` se puede crear, editar y borrar una nota. El markdown se muestra renderizado.
- [ ] Los filtros `q`, `tag` y `project` viven en `searchParams` y sobreviven a recargar.
- [ ] Una nota se puede vincular a un proyecto y desvincular con `projectId: null`.
- [ ] Las cinco tools `forge_*_note` existen en el MCP con los argumentos del modelo. `forge_update_note` rechaza llamadas sin campos y `tags` junto con `addTags` o `removeTags`.
- [ ] `addTags` une sin duplicados y `removeTags` quita después, como en SPEC 30.
- [ ] `forge_delete_note` devuelve `{ id }`. Un id inexistente sale como `Note not found.` por `toToolError`.
- [ ] `forge-cli note list|get|add|update|delete` funciona y soporta salida JSON como `idea`.
- [ ] `skills/forge/forge-notes/SKILL.md` existe y describe cuándo guardar y buscar.
- [ ] Tests nuevos en core, web, CLI y MCP. `pnpm lint`, `pnpm test` y `pnpm build` pasan.
- [ ] `docs/ROADMAP.md` y `apps/mcp/README.md` reflejan Notes.

## Decisiones

- **Sí:** Tool propia `/notes` con tabla `notes`. Resources sigue siendo solo enlaces; mezclarlos deshace la poda.
- **Sí:** Modelo flexible: título, markdown, tags y proyecto opcional. Sin `kind`, `library` ni `version`; la versión va como tag (`rn-0.76`).
- **Sí:** `project_id` opcional con `ON DELETE SET NULL`. Las notas de librerías son globales; las de un proyecto se vinculan. Borrar el proyecto no pierde conocimiento.
- **Sí:** Búsqueda `ilike` en título, contenido y tags. Escala suficiente para notas personales; sin migración extra.
- **Sí:** Todas las superficies en un spec (web, MCP, CLI, skill), por decisión del usuario. Se divide en cinco grupos commiteables.
- **Sí:** El agente es el autor principal. La skill `forge-notes` y las tools MCP existen para eso; la web sirve para revisar y editar.
- **Sí:** Mismo patrón que Ideas (spec 21) y Resources MCP (spec 30): `createNotesService` compartido, `addTags`/`removeTags`, delete sin `confirm`.
- **Sí:** `normalizeTags` se comparte entre ideas y notas en vez de duplicarse.
- **No:** Notas de despliegue como tipo. Se registran como tickets ("desplegar a main, correr esto").
- **No:** Leer notas automáticamente en `forge_next_ticket`. Se evalúa tras usar Notes unas semanas.
- **No:** Full-text, ranking o embeddings. Sin volumen que lo justifique.
- **No:** Reemplazar context7. Notes guarda lo que context7 no tiene: correcciones a la doc, configs probadas, decisiones y libs privadas.
- **No:** Ampliar Resources con `content` y `url` opcional.

## Riesgos

- **La tabla queda vacía.** Si el agente no guarda notas, Notes no sirve. Mitigación: la skill `forge-notes` define cuándo guardar y las tools MCP lo hacen en una llamada. Si tras unas semanas sigue vacía, es señal para descartar la tool.
- **`ilike` sobre `content`.** Con notas de hasta 100000 caracteres, el escaneo crece. Mitigación: el índice `(user_id, created_at DESC)` acota por usuario. Con cientos de notas personales no pesa; si crece, pasar a full-text en otra spec.
- **Búsqueda en tags.** `tags` es `TEXT[]`; `ilike` directo no aplica. El servicio filtra con `tags::text` o unión por `or`, y debe verificarse en InsForge. Si no funciona, `q` busca solo título y contenido, y `tag` cubre el filtro exacto.
- **`addTags`/`removeTags` no atómicos.** Leen y luego escriben. Dos escrituras concurrentes pueden perder un cambio. Aceptable para uso personal, como en SPEC 30.
- **Notas con datos sensibles.** El agente podría guardar tokens o credenciales en `content`. Mitigación: la skill prohíbe guardar secretos. La RLS las mantiene privadas, pero no hay cifrado.
- **Alcance grande.** Cinco grupos en cuatro áreas. Mitigación: cada grupo deja el sistema funcional y se puede commitear aparte.

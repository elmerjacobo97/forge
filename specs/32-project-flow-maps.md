# SPEC 32 — Mapas de flujo por proyecto

> **Estado:** Approved
> **Depende de:** SPEC 04 — Proyectos del Dev Board · SPEC 18 — Servidor MCP remoto · SPEC 30 — CRUD de resources en el MCP · SPEC 31 — Notes
> **Fecha:** 2026-10-16
> **Objetivo:** Guardar por proyecto un mapa de módulos y flujos paso a paso, que el agente escribe por MCP y CLI y que tú lees en la web para entender cómo está conectado el código.

## Alcance

**Incluye:**

- Tablas `public.project_modules` y `public.project_flows` con RLS por usuario, migración en `migrations/`.
- Módulo: `slug`, nombre, descripción y `depends_on` (slugs de otros módulos del mismo proyecto). Identificado por `(project_id, slug)`.
- Flujo: `slug`, título, resumen, módulo y `steps` en JSONB. Identificado por `(project_id, slug)`.
- Cada paso lleva `kind` (`page`, `ui`, `action`, `service`, `db`, `command`, `tool`), nombre de función, `file:line`, entrada, retorno y marca `inferred`.
- Campo opcional `commit` en el flujo, para saber contra qué versión del código se generó.
- Upsert por slug: regenerar reemplaza el contenido y actualiza `updated_at`.
- Servicio `createProjectMapService` en `packages/forge-core` (módulos y flujos: list, get, upsert, delete), con schemas Zod y tipos exportados.
- Ruta web `/dev-board/[projectId]/flows`, con tres niveles de zoom: mapa de módulos con sus dependencias, módulo con sus flujos, flujo como lista de pasos con badge por `kind`.
- Tools MCP de lectura, upsert y borrado para módulos y flujos.
- Comando `forge-cli project map` para las mismas operaciones.
- Skill `forge-flows` con cómo generar un flujo desde el grafo: módulos desde las carpetas, pasos desde aristas `calls`, `inferred` cuando el paso sale de leer el componente.
- Borrar un proyecto borra sus módulos y flujos (`ON DELETE CASCADE`). Borrar un módulo borra sus flujos.
- Tests en core, web, CLI y MCP; docs en `apps/mcp/README.md`.

**Fuera de alcance (specs futuras):**

- Generar flujos dentro de Forge: no hay acceso al repo ni backend de IA. Genera el agente, Forge guarda y pinta.
- Generación automática de todos los flujos de un módulo; los flujos se crean bajo demanda.
- Detectar que un flujo quedó viejo respecto al código; solo se guarda `commit`.
- Render con Mermaid o diagrama de nodos.
- Editar pasos desde la web; la web solo lee y borra.
- Importar `graphify-out/graph.json` o leer el repo desde Forge.
- Vincular flujos a tickets.
- Historial de versiones de un flujo.
- Compartir mapas o espacios de equipo.

## Modelo de datos

Migración nueva: `migrations/<timestamp>_project_map.sql`.

```sql
CREATE TABLE public.project_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.dev_board_projects(id) ON DELETE CASCADE,
  slug TEXT NOT NULL CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND char_length(slug) <= 60),
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 120),
  description TEXT NOT NULL DEFAULT '' CHECK (char_length(description) <= 2000),
  depends_on TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (project_id, slug)
);

CREATE TABLE public.project_flows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.dev_board_projects(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES public.project_modules(id) ON DELETE CASCADE,
  slug TEXT NOT NULL CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND char_length(slug) <= 60),
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 200),
  summary TEXT NOT NULL DEFAULT '' CHECK (char_length(summary) <= 2000),
  steps JSONB NOT NULL CHECK (jsonb_typeof(steps) = 'array' AND jsonb_array_length(steps) BETWEEN 1 AND 20),
  commit TEXT NULL CHECK (char_length(commit) <= 40),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (project_id, slug)
);
```

Igual que `notes`: índice `(user_id, project_id)` en ambas, índice `(module_id)` en flujos, triggers `*_updated_at` y `*_prevent_user_change`, RLS con cuatro políticas `*_own` por tabla y `GRANT` a `authenticated`.

Tipos en `packages/forge-core/src/types.ts`:

```ts
type FlowStepKind = "page" | "ui" | "action" | "service" | "db" | "command" | "tool";

type ProjectFlowStep = {
  kind: FlowStepKind;
  label: string; // qué pasa en este paso, una línea
  symbol?: string; // función o componente
  file?: string; // ruta relativa al repo
  line?: number;
  input?: string;
  output?: string;
  inferred: boolean; // true si no sale de una arista del grafo
};

type ProjectModule = {
  id: string;
  projectId: string;
  slug: string;
  name: string;
  description: string;
  dependsOn: string[]; // slugs de otros módulos del proyecto
  updatedAt: string;
};

type ProjectModuleUpsertInput = Omit<ProjectModule, "id" | "projectId" | "updatedAt">;

type ProjectFlow = {
  id: string;
  projectId: string;
  moduleSlug: string;
  slug: string;
  title: string;
  summary: string;
  steps: ProjectFlowStep[];
  commit: string | null;
  updatedAt: string;
};

type ProjectFlowUpsertInput = Omit<ProjectFlow, "id" | "projectId" | "updatedAt">;
```

Reglas:

- `slug`: minúsculas, números y guiones, máximo 60. Identifica el módulo o flujo dentro del proyecto.
- Upsert por `(project_id, slug)`: crea o reemplaza todo el contenido y toca `updated_at`.
- `depends_on`: el servicio rechaza slugs que no existan en el proyecto y el propio slug. Si luego se borra un módulo, las referencias de otros quedan colgando; la web las ignora.
- Un flujo exige que su `moduleSlug` exista. El servicio lo resuelve a `module_id`; si no existe, error `Module not found.`.
- `steps`: de 1 a 20 pasos, validados con Zod. `inferred` es `false` por defecto.
- `file` es relativo al repo, nunca absoluto.
- `commit`: opcional, SHA de hasta 40 caracteres.
- Borrar un módulo borra sus flujos. Borrar un proyecto borra módulos y flujos.

## Plan de implementación

### Grupo 1 — Migración y core

- [x] 1.1 Crear `migrations/<timestamp>_project_map.sql`: tablas `project_modules` y `project_flows`, índices, triggers, RLS y `GRANT`, calcado de `notes`.
- [x] 1.2 Añadir en `packages/forge-core/src/types.ts` `FlowStepKind`, `ProjectFlowStep`, `ProjectModule`, `ProjectFlow` y los inputs de upsert.
- [x] 1.3 Crear `packages/forge-core/src/project-map-schema.ts`: slug, paso, módulo y flujo con Zod (1–20 pasos, `inferred` por defecto `false`, `file` relativo).
- [x] 1.4 Crear `packages/forge-core/src/project-map-service.ts` con `createProjectMapService`: `getMap` (módulos y resumen de flujos), `upsertModule`, `deleteModule`, `getFlow`, `upsertFlow`, `deleteFlow`. Valida `depends_on` contra los slugs del proyecto y resuelve `moduleSlug` a `module_id`. Exportar en `index.ts`.
- [x] 1.5 Tests en `packages/forge-core/tests/`: upsert crea y reemplaza, `depends_on` con slug inexistente o propio, módulo inexistente en un flujo, 0 y 21 pasos, borrado en cascada.

### Grupo 2 — Web

- [x] 2.1 Crear `apps/web/src/features/project-map/` (`components/`, `services/`, `actions.ts`) siguiendo `features/dev-board/`. `actions.ts` solo tiene borrar módulo y borrar flujo, con revalidación.
- [x] 2.2 Rutas `apps/web/src/app/(authenticated)/dev-board/[projectId]/flows/` (`page.tsx`, `loading.tsx`, `error.tsx`). `module` y `flow` viven en `searchParams` para que cada nivel de zoom sobreviva a recargar.
- [x] 2.3 Componentes: mapa de módulos con chips de `depends_on` (slugs desconocidos se ignoran), vista de módulo con su lista de flujos, y lista de pasos con badge por `kind`, `file:line`, entrada, retorno y marca de `inferred`.
- [x] 2.4 Diálogos de borrado de módulo y de flujo, y enlace a Flows en `project-board-header.tsx`.
- [x] 2.5 Tests colocados: parseo de `searchParams`, componente de pasos y estados vacíos.

### Grupo 3 — MCP

- [x] 3.1 Añadir `projectMap: createProjectMapService({ client })` en `apps/mcp/src/services.ts` y extender `apps/mcp/tests/helpers/mock-services.ts`.
- [x] 3.2 Schemas en `apps/mcp/src/tool-schemas.ts`: mapa, flujo, upsert de módulo, upsert de flujo y borrados. Cada campo de texto lleva la regla de alcance de la spec 23: usar solo lo que el código muestra, sin inventar pasos.
- [x] 3.3 Handlers en `apps/mcp/src/tools.ts` y registro en `apps/mcp/src/index.ts`: `forge_get_project_map`, `forge_get_project_flow`, `forge_upsert_project_module`, `forge_upsert_project_flow`, `forge_delete_project_module`, `forge_delete_project_flow`. Errores por `toToolError`.
- [x] 3.4 Tests en `apps/mcp/tests/` y las seis filas en `apps/mcp/README.md`.

### Grupo 4 — CLI

- [x] 4.1 Extender `apps/cli/src/commands/project.ts` con `map get`, `map module set|delete` y `map flow get|set|delete`. `flow set` recibe los pasos con `--file <ruta.json>`, no con flags.
- [x] 4.2 Añadir `formatProjectMapText`, `formatProjectFlowText` y sus variantes JSON en `apps/cli/src/format.ts`.
- [x] 4.3 Actualizar la ayuda en `apps/cli/src/main.ts`.
- [x] 4.4 Tests en `apps/cli/tests/lib/format.test.ts` y del parseo de `--file`.

### Grupo 5 — Skill y docs

- [x] 5.1 Crear `skills/forge/forge-flows/SKILL.md`: módulos desde las carpetas del repo, pasos desde aristas `calls` de `graphify query`, `inferred: true` cuando el paso sale de leer el componente, 4–8 pasos por flujo, flujos solo bajo demanda y sin inventar.
- [x] 5.2 Actualizar `docs/ROADMAP.md`, el `README` del CLI y la skill `forge-projects` con un puntero al mapa.
- [x] 5.3 Correr `pnpm lint`, `pnpm test` y `pnpm build`.

## Criterios de aceptación

- [ ] La migración crea `project_modules` y `project_flows` con RLS. Un usuario no ve, edita ni borra el mapa de otro.
- [ ] Borrar un proyecto borra sus módulos y flujos. Borrar un módulo borra sus flujos.
- [ ] `slug` con mayúsculas, espacios o más de 60 caracteres falla en el schema y no llama al servicio.
- [ ] Un flujo con 0 pasos o con 21 pasos falla en el schema. Un paso con `kind` fuera de la lista falla.
- [ ] `inferred` es `false` cuando el paso no lo indica.
- [ ] `upsertModule` y `upsertFlow` con un slug existente reemplazan el contenido y no crean una fila nueva.
- [ ] `depends_on` con un slug inexistente en el proyecto, o con el propio slug, se rechaza.
- [ ] `upsertFlow` con un `moduleSlug` inexistente devuelve `Module not found.`.
- [ ] `/dev-board/[projectId]/flows` muestra el mapa de módulos con sus dependencias. Sin sesión redirige a login.
- [ ] `module` y `flow` en `searchParams` abren el nivel correspondiente y sobreviven a recargar.
- [ ] Un flujo se pinta como lista de pasos con badge por `kind`, `file:line`, entrada y retorno. Los pasos con `inferred: true` muestran una marca visible.
- [ ] Una dependencia a un módulo borrado no rompe la página y no se muestra.
- [ ] Desde la web se puede borrar un módulo y un flujo con confirmación. No hay edición de pasos.
- [ ] Las seis tools `forge_*_project_*` existen en el MCP. `forge_delete_project_module` y `forge_delete_project_flow` devuelven `{ slug }`.
- [ ] Las descripciones de las tools MCP indican que solo se escribe lo que el código muestra.
- [ ] `forge-cli project map get|module set|module delete|flow get|flow set|flow delete` funciona y soporta salida JSON.
- [ ] `forge-cli project map flow set --file` rechaza un JSON inválido sin llamar al servicio.
- [ ] `skills/forge/forge-flows/SKILL.md` existe y describe módulos, pasos, `inferred` y el límite de 4–8 pasos.
- [ ] Tests nuevos en core, web, CLI y MCP. `pnpm lint`, `pnpm test` y `pnpm build` pasan.
- [ ] `docs/ROADMAP.md` y `apps/mcp/README.md` reflejan el mapa.

## Decisiones

- **Sí:** El flujo es la unidad de lectura, no el grafo completo. Un dev entiende "cómo se crea un proyecto" paso a paso; 3854 nodos no.
- **Sí:** Tres niveles de zoom: mapa de módulos, módulo con sus flujos, flujo como lista de pasos.
- **Sí:** Los módulos salen de las carpetas del repo (`features/<feature>`, `apps/*`, `packages/*`), no de las 295 comunidades de graphify, cuyos nombres son arbitrarios (`throwIfError`, `@hugeicons/react`).
- **Sí:** La UI es parte del flujo. Los pasos `page` y `ui` van antes de `action`, `service` y `db`, así el dev ve el recorrido completo desde el botón hasta la tabla.
- **Sí:** CLI y MCP entran como pasos `command` y `tool` que convergen en el mismo `service`. Se ve que "crear proyecto" tiene tres entradas y un servicio.
- **Sí:** `inferred` por paso. El grafo cubre bien acción → servicio → tabla (aristas `calls`), pero casi no cubre qué botón abre qué dialog (JSX). Esos pasos se marcan como inferidos en vez de pasar por ciertos.
- **Sí:** Forge guarda y pinta; el agente genera. Forge no tiene acceso al repo ni backend de IA, y añadirlos es otra spec.
- **Sí:** Flujos bajo demanda, por decisión del usuario. Empiezas con pocos que sí importan y el mapa crece cuando lo necesitas.
- **Sí:** Tabla de módulos con `depends_on` en esta spec, por decisión del usuario. El mapa de cajas con flechas es el nivel que da contexto antes de entrar a un flujo.
- **Sí:** `steps` en JSONB validado con Zod. El agente reemplaza el flujo entero; nadie edita un paso suelto.
- **Sí:** Upsert por `(project_id, slug)`. Regenerar no deja duplicados.
- **Sí:** `depends_on` como `TEXT[]` de slugs, validado en el servicio. Sin tabla de aristas.
- **Sí:** `ON DELETE CASCADE` desde el proyecto y desde el módulo. Es contenido derivado y regenerable; no debe bloquear el borrado.
- **Sí:** Ruta `/dev-board/[projectId]/flows`, como analytics. El mapa pertenece a un proyecto, no a una tool del sidebar.
- **Sí:** Lista de pasos propia con badge por `kind`. Mermaid no lleva `kind`, `file:line`, entrada ni retorno por paso, y añade una dependencia.
- **Sí:** Todas las superficies en un spec (web, MCP, CLI, skill), por decisión del usuario. Se divide en cinco grupos commiteables.
- **Sí:** Las descripciones de las tools MCP llevan la regla de alcance de la spec 23: escribir solo lo que el código muestra.
- **Sí:** `commit` opcional por flujo. Da pista de qué versión del código describe, sin construir detección de obsolescencia.
- **No:** Mermaid o diagrama de nodos. Es otro render y no carga los datos por paso.
- **No:** Generar flujos dentro de Forge o leer `graph.json` desde el servidor.
- **No:** Generar todos los flujos de un módulo de forma automática. Llena Forge de contenido que nadie lee.
- **No:** Detectar flujos obsoletos. Con `commit` guardado se puede añadir después.
- **No:** Tabla `project_flow_steps`. Añade reorden, RPC y tests para un caso que no existe.
- **No:** Editar pasos desde la web. El autor es el agente.

## Riesgos

- **El mapa queda vacío.** Si el agente no genera flujos, la pestaña no sirve. Mitigación: la skill `forge-flows` define cómo hacerlo en una llamada. Si tras unas semanas sigue vacía, es señal para descartar la feature.
- **Flujos que mienten.** La IA puede inventar un paso o una conexión. Mitigación: cada paso cita `file:line`, la skill exige que salga de una arista `calls` y los pasos que no salen del grafo van con `inferred: true`. Aun así nada verifica que el paso exista.
- **Flujos obsoletos.** El código cambia y el flujo no. Mitigación: se guarda `commit` para saber contra qué versión se generó. La detección automática queda fuera.
- **Los pasos de UI salen mal del grafo.** El vínculo botón → dialog es JSX y casi no deja aristas. Mitigación: el agente los lee del componente y los marca `inferred`. Si la marca aparece en casi todos los pasos de UI, la skill necesita otra estrategia.
- **`depends_on` colgante.** Borrar un módulo deja slugs sin destino en los demás. Mitigación: la web los ignora y el siguiente upsert del módulo afectado los limpia al validar.
- **`steps` sin tipado en la base.** Es JSONB; la validación vive en Zod. Un cambio de forma obliga a migrar filas. Mitigación: todos los pasos pasan por `project-map-schema.ts` y el schema es la única fuente de la forma.
- **Alcance grande.** Dos tablas y cuatro superficies. Mitigación: cada grupo deja el sistema funcional y se puede commitear aparte. Si hay que recortar, el CLI (grupo 4) es lo primero que se aplaza.

## Qué **no** entra en esta spec

- Generar flujos dentro de Forge o leer el repo desde el servidor.
- Generación automática de todos los flujos de un módulo.
- Detección de flujos obsoletos.
- Render con Mermaid o diagrama de nodos.
- Edición de pasos desde la web.
- Vínculo de flujos con tickets, historial de versiones y mapas compartidos.

Cada uno, si llega, va en su propia spec.

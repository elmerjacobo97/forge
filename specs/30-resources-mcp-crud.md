# SPEC 30 — CRUD de resources en el MCP

> **Estado:** Implementado
> **Depende de:** SPEC 18 — Servidor MCP remoto de Forge · SPEC 23 — Escritura de tickets en el MCP · SPEC 08 — Resources
> **Fecha:** 2026-10-09
> **Objetivo:** Añadir al MCP remoto tools para listar, leer, crear, actualizar y borrar resources, reusando `createResourcesService` de forge-core.

## Alcance

**Incluye:**

- Cinco tools nuevas en el MCP remoto de `apps/mcp`, misma sesión OAuth de GitHub y mismo cliente InsForge que las tools de tickets.
- `forge_list_resources`: `limit`, `offset` y `category` opcionales. Orden `created_at` desc. Sin `limit` devuelve todo. Devuelve `Resource[]`.
- `forge_get_resource`: `resourceId`. Devuelve `Resource`.
- `forge_create_resource`: `title`, `url`, `category` y `description` obligatorios. `tags` opcional, default `[]`. Devuelve `Resource`.
- `forge_update_resource`: `resourceId` más al menos un campo entre `title`, `url`, `category`, `description`, `tags`, `addTags`, `removeTags`. Devuelve `Resource`.
- `forge_delete_resource`: `resourceId`. Sin `confirm`. Devuelve `{ id }`.
- Cambio en `packages/forge-core`: `resourcesService.list` acepta `category` en `ListOptions`.
- `services.ts` del MCP expone `resources: createResourcesService({ client })`.
- Schemas en `apps/mcp/src/tool-schemas.ts`, handlers en `apps/mcp/src/tools.ts`, registro en `apps/mcp/src/index.ts`. Errores por `toToolError`.
- Tests en `apps/mcp/tests/` y en `packages/forge-core/tests/` (filtro `category`).
- Documentar las cinco tools en `apps/mcp/README.md`.

**Fuera de alcance (para specs futuras):**

- Ideas, Uptime Monitor, Webhook Inspector.
- Búsqueda de texto en resources.
- Detectar URLs duplicadas.
- Cambios en `apps/web`, en el CLI y en `migrations/`.
- Flag `confirm` en delete.
- Prompts o resources de MCP (el protocolo, no los Forge resources).

## Modelo de datos

Sin tablas, columnas ni RPC nuevos. La tabla `resources` y RLS ya existen. Único cambio en core: `list` acepta filtro `category`.

Cambio en `packages/forge-core/src/types.ts`:

```ts
type ResourceListOptions = ListOptions & {
  category?: ResourceCategory; // filtra con .eq("category", …)
};
```

`resourcesService.list(options: ResourceListOptions = {})`. Sin `category` el comportamiento actual no cambia.

Entradas nuevas en `apps/mcp/src/tool-schemas.ts`:

```ts
type ListResourcesArgs = {
  limit?: number; // entero ≥ 1
  offset?: number; // entero ≥ 0, exige limit
  category?: ResourceCategory;
};

type ResourceIdArgs = { resourceId: string }; // get y delete

type CreateResourceArgs = {
  title: string;
  url: string;
  category: ResourceCategory;
  description: string;
  tags?: string[]; // default []
};

type UpdateResourceArgs = {
  resourceId: string;
  title?: string;
  url?: string;
  category?: ResourceCategory;
  description?: string;
  tags?: string[]; // reemplaza el array entero
  addTags?: string[]; // se unen a los actuales, sin duplicados
  removeTags?: string[]; // se quitan después de añadir
};
```

Reglas:

- `ResourceCategory` es `docs | git | tool | article | other`.
- `title` mínimo 2. `url` URL válida. `description` de 5 a 200. Mismos límites que `resource-schema.ts`; los campos de create y update salen de `resourceCreateSchema.shape`.
- Cada tag es string con trim y no vacío.
- `forge_update_resource` exige `resourceId` más al menos un campo. `tags` no se combina con `addTags` ni `removeTags`.
- `addTags` / `removeTags`: el handler lee el resource, calcula `(actuales ∪ addTags) − removeTags` sin duplicados y llama a `update` con `tags`.
- `forge_list_resources` rechaza `offset` sin `limit`.
- Retornos: list → `Resource[]`; get, create y update → `Resource`; delete → `{ id: string }`.

## Plan de implementación

### Grupo 1 — Filtro `category` en core

- [x] 1.1 Añadir `ResourceListOptions` en `packages/forge-core/src/types.ts` y usarlo en la firma de `resourcesService.list` (`packages/forge-core/src/resources-service.ts`). Con `category`, aplicar `.eq("category", …)` antes de `order`/`range`.
- [x] 1.2 Cubrir en `packages/forge-core/tests/services/resources-service.test.ts`: list con `category` filtra, y sin `category` no cambia.

### Grupo 2 — Schemas de entrada

- [x] 2.1 Añadir en `apps/mcp/src/tool-schemas.ts` `listResourcesInput`, `resourceIdInput`, `createResourceInput` y `updateResourceInput`, con los límites y reglas del modelo. Reusar `resourceCreateSchema.shape` de `@forge/core`.
- [x] 2.2 Cubrir en `apps/mcp/tests/tool-schemas.test.ts`: caso válido, default `tags: []`, rechazo de `category`, `url`, `description` inválidos, `offset` sin `limit`, update sin campos, y `tags` combinado con `addTags`/`removeTags`.

### Grupo 3 — Handlers

- [x] 3.1 Añadir `resources: createResourcesService({ client })` en `apps/mcp/src/services.ts`.
- [x] 3.2 Extender `apps/mcp/tests/helpers/mock-services.ts` con `resources.list`, `get`, `create`, `update` y `delete`.
- [x] 3.3 Añadir en `apps/mcp/src/tools.ts` los handlers `listResources`, `getResource`, `createResource`, `updateResource` y `deleteResource`. Update con `addTags`/`removeTags` lee el resource, calcula las tags y llama a `update` con `tags`. Delete llama a `resources.delete` y devuelve `{ id }`.
- [x] 3.4 Probar en `apps/mcp/tests/tools.test.ts`: llamadas al servicio, unión/resta de tags sin duplicados, `{ id }` en delete, y que `Resource not found.` se propaga.

### Grupo 4 — Registro y docs

- [x] 4.1 Registrar las cinco tools en `apps/mcp/src/index.ts` con el mismo `run()`: `forge_list_resources`, `forge_get_resource`, `forge_create_resource`, `forge_update_resource`, `forge_delete_resource`.
- [x] 4.2 Añadir las cinco filas a la tabla de tools en `apps/mcp/README.md`, con argumentos y retorno.

## Criterios de aceptación

- [x] `forge_list_resources` devuelve `Resource[]` en orden `created_at` desc. Con `category` solo devuelve esa categoría. Con `limit`/`offset` pagina. Sin `limit` devuelve todo.
- [x] `forge_list_resources` rechaza `offset` sin `limit` y una `category` fuera de `docs | git | tool | article | other`.
- [ ] `forge_get_resource` exige `resourceId` y devuelve el `Resource`. Id inexistente sale como `Resource not found.` por `toToolError`.
- [x] `forge_create_resource` exige `title`, `url`, `category` y `description`. Sin `tags` guarda `[]`.
- [x] `title` de 1 carácter, `url` inválida y `description` fuera de 5–200 fallan en el schema y no llaman al servicio.
- [x] `forge_update_resource` rechaza una llamada sin ningún campo además de `resourceId`.
- [x] `forge_update_resource` rechaza `tags` junto con `addTags` o `removeTags`.
- [x] `addTags` une a las tags actuales sin duplicados. `removeTags` las quita después. El resultado se guarda con `update`.
- [x] `forge_delete_resource` exige solo `resourceId`, llama a `resources.delete` y devuelve `{ id }`. No pide `confirm`.
- [ ] Un error del servicio sale por `toToolError`.
- [x] `resourcesService.list` sin `category` se comporta igual que antes.
- [x] Tests nuevos en `apps/mcp/tests/` y `packages/forge-core/tests/services/resources-service.test.ts`. `pnpm test` pasa y `pnpm --filter @forge/mcp typecheck` pasa.
- [x] `apps/mcp/README.md` lista las cinco tools con argumentos y retorno.
- [x] `apps/web`, el CLI y `migrations/` no cambian.

## Decisiones

- **Sí:** Cinco tools sobre el MCP de SPEC 18. Reusan `createResourcesService`. Sin SQL nuevo.
- **Sí:** `forge_delete_resource` sin `confirm`. Mismo criterio que SPEC 23: la allowlist de GitHub es la puerta. El servicio comprueba que existe antes de borrar.
- **Sí:** Delete entra aquí aunque SPEC 23 lo excluyó para tickets. Un resource es un enlace guardado; un ticket lleva tiempo y comentarios.
- **Sí:** `tags` reemplaza el array entero, y además `addTags`/`removeTags` para cambios incrementales. El agente no tiene que leer antes de escribir.
- **No:** Combinar `tags` con `addTags`/`removeTags`. Evita semántica ambigua.
- **Sí:** El handler calcula `(actuales ∪ addTags) − removeTags`. Las tags viven en un array en `resources`; no hay RPC. Lectura y escritura no son atómicas (ver riesgos).
- **Sí:** Filtro `category` en `list`, implementado en core. CLI y MCP comparten servicio.
- **Sí:** `tags` opcional con default `[]` en create. Core y CLI siguen exigiéndolo.
- **Sí:** `offset` exige `limit`. El servicio ignora `offset` sin `limit`; mejor rechazar que ignorar en silencio.
- **Sí:** Delete devuelve `{ id }`. El servicio devuelve `void`.
- **No:** Búsqueda de texto, detección de URLs duplicadas, Ideas, web, CLI y migraciones. Cada uno, si llega, va en su spec.

## Riesgos

| Riesgo                                                                                                                             | Mitigación                                                                                                                 |
| ---------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `addTags`/`removeTags` leen y luego escriben sin atomicidad. Dos llamadas concurrentes sobre el mismo resource pueden perder tags. | Uso de un solo usuario. Para un resultado exacto, usar `tags` (reemplazo). Si duele, RPC propio en otra spec.              |
| Un agente borra un resource sin segunda confirmación y no hay deshacer.                                                            | Sin `confirm` por decisión; la allowlist de GitHub es la puerta. Delete solo acepta `resourceId` y devuelve el id borrado. |
| `forge_list_resources` sin `limit` devuelve toda la tabla y puede crecer.                                                          | Documentar `limit` en la description de la tool y en el README.                                                            |
| Cambiar la firma de `resourcesService.list` afecta a web y CLI.                                                                    | `category` es opcional; sin él, el comportamiento no cambia. Test de regresión en 1.2.                                     |

## Qué **no** está en esta spec

- Ideas, Uptime Monitor, Webhook Inspector.
- Búsqueda de texto y detección de URLs duplicadas en resources.
- Cambios en `apps/web`, en el CLI y en `migrations/`.
- Flag `confirm` en delete.
- Prompts o resources de MCP.

Cada uno, si llega, va en su propia spec.

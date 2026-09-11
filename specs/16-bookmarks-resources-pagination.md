# SPEC 16 — Paginación de bookmarks y resources

> **Estado:** Implementado
> **Depende de:** SPEC 02 — CLI Forge para bookmarks; SPEC 08 — Resources: configuraciones y recursos de desarrollo
> **Fecha:** 2026-09-10
> **Objetivo:** Añadir paginación server-side de 12 items con botón `Load more`, contador `Showing X of Y` y progreso persistido en `?visible` a las listas web de bookmarks y resources, más flags opcionales `--limit`/`--offset` en `bookmark list` y `resource list` del CLI.

## Alcance

**Incluye:**

- Paginación server-side de bookmarks web: primera página de 12 items vía `range(0, visible - 1)`.
- Paginación server-side de resources web con el mismo mecanismo.
- Parámetro `?visible` en la URL, normalizado al rango 12–96, default 12.
- Botón `Load more` que incrementa `?visible` en 12 por cada pulsación.
- Contador `Showing X of Y` usando `count: "exact"`.
- Botón oculto cuando X alcanza Y.
- Reset a 12 items visibles al cambiar búsqueda o cualquier filtro.
- Mover filtros actuales a la query de InsForge:
  - Bookmarks: `category` con igualdad; `q` con `ilike` sobre `title` y `description` más `tags` con match exacto de la query completa.
  - Resources: `kind`, `tool`, `tag` con igualdad; `format` conservando la semántica actual de `other`; `q` con `ilike` sobre `title` y `content` más `tags` con match exacto.
- Orden estable `created_at desc, id desc` en ambas listas.
- Dropdown de tags de resources alimentado por una query aparte que lee `tags` de todas las filas.
- Servicios web devuelven `{ items, total }` (y `tags` en resources); las páginas pasan `visible` y filtros.
- Estado `Load more`: botón deshabilitado con `aria-busy` durante la transición de navegación.
- Fallo de carga apoyado en el `error.tsx` existente; sin reintento inline.
- CLI: flags opcionales `--limit` (entero 1–1000) y `--offset` (entero ≥ 0) en `bookmark list` y `resource list`.
- CLI sin flags mantiene el comportamiento actual: devuelve todas las filas.
- CLI valida los flags y falla con mensaje claro y exit code 1 si son inválidos.
- Actualizar tests web y CLI afectados por las nuevas firmas y validaciones.

**Fuera de alcance:**

- Paginación por cursor o keyset, scroll infinito o virtualización.
- Nuevas opciones de orden o cambios al orden existente.
- Full-text search con `tsvector`, RPC o migraciones de base de datos.
- Cambios a create, update, delete, dialogs, actions o RLS.
- Rediseño del toolbar o de los componentes de filtros.
- Paginación por defecto en el CLI o subcomandos interactivos.
- Cambios a otros consumidores de los servicios fuera de las páginas de bookmarks y resources.
- Componentes bajo `apps/web/src/components/ui`.

## Data model

Parametrización de la URL web, en `apps/web/src/lib/pagination.ts`:

```ts
export const PAGE_SIZE = 12;
export const MIN_VISIBLE = 12;
export const MAX_VISIBLE = 96;

export function parseVisibleParam(value: string | string[] | undefined): number;
```

Reglas:

- `visible` ausente, no numérico, no entero o menor que `MIN_VISIBLE` se normaliza a `PAGE_SIZE`.
- `visible` mayor que `MAX_VISIBLE` se recorta a `MAX_VISIBLE`.
- Cada pulsación de `Load more` suma `PAGE_SIZE` a `visible`.
- El servidor siempre consulta `range(0, visible - 1)`.

Servicios web:

```ts
export interface BookmarksPage {
  bookmarks: Bookmark[];
  total: number;
}

export interface ResourcesPage {
  resources: Resource[];
  tags: string[];
  total: number;
}

// bookmarks-service.ts
fetchBookmarks(filters: BookmarkFilters, visible: number): Promise<BookmarksPage>;

// resources-service.ts
fetchResourcesPage(filters: ResourceFilters, visible: number): Promise<ResourcesPage>;
```

Reglas:

- `total` viene de `count: "exact"` en la misma query; no se añade una query extra de conteo.
- `BookmarkFilters` y `ResourceFilters` conservan sus campos actuales; dejan de aplicarse en JS.
- Los helpers `filterBookmarks` y `filterResources` se eliminan junto con sus tests; su lógica se sustituye por filtros de query.
- `tags` de resources se obtiene en una query aparte que lee `tags` de todas las filas, sin paginar.

Componentes:

```ts
// apps/web/src/features/bookmarks/bookmarks.tsx
Bookmarks({ bookmarks, filters, total }: { bookmarks: Bookmark[]; filters: BookmarkFilters; total: number });

// apps/web/src/features/resources/resources.tsx
Resources({ resources, filters, tags, total }: { resources: Resource[]; filters: ResourceFilters; tags: string[]; total: number });

// apps/web/src/components/list-pagination.tsx  ("use client")
ListPagination({ loaded, total }: { loaded: number; total: number });
```

Reglas:

- `ListPagination` renderiza el contador `Showing X of Y` y el botón `Load more`; se oculta cuando `loaded >= total`.
- `ListPagination` lee `usePathname` y `useSearchParams`, y actualiza solo `visible` con `router.replace` dentro de `useTransition`.
- El botón queda deshabilitado con `aria-busy` mientras la transición está activa.

CLI:

```ts
// apps/cli/src/types.ts
export interface ListOptions {
  limit?: number; // entero 1–1000
  offset?: number; // entero ≥ 0, exige limit
}
```

Reglas:

- `bookmark list` y `resource list` aceptan `--limit` y `--offset`; sin flags, `list()` se comporta como hoy y devuelve todas las filas.
- `--offset` sin `--limit` es un error de validación: evita rangos abiertos con fin arbitrario.
- La validación vive en `apps/cli/src/flags.ts` como `parseListOptions(args)`, devolviendo `{ options }` o `{ error }` con el mismo patrón de schemas del CLI.

## Plan de implementación

1. Crear `apps/web/src/lib/pagination.ts` con `PAGE_SIZE`, `MIN_VISIBLE`, `MAX_VISIBLE` y `parseVisibleParam`. Añadir `pagination.test.ts` cubriendo ausente, no numérico, no entero, límites inferior/superior y valores válidos. Sin consumidores aún; no rompe nada.
2. Crear `apps/web/src/components/list-pagination.tsx` como cliente: contador `Showing X of Y`, botón `Load more` con `useTransition`, `router.replace` preservando los params actuales y actualizando solo `visible`. Añadir test de componente para incremento, ocultación con `loaded >= total` y `aria-busy`.
3. Migrar bookmarks a server-side: `fetchBookmarks(filters, visible)` con `.select(COLUMNS, { count: "exact" })`, filtros PostgREST (`category` con `eq`; `q` con `or` de `title.ilike`, `description.ilike` y `tags.cs` exacto), orden `created_at desc, id desc`, `range(0, visible - 1)` y retorno `{ bookmarks, total }`. Actualizar `page.tsx`, `bookmarks.tsx` y montar `ListPagination`. La página queda funcional con paginación completa.
4. Migrar resources con el mismo patrón: `kind`, `tool`, `tag` con `eq`; `format` conservando la semántica de `other` (igualdad a `"other"` o `language not in` formatos conocidos); `q` con `or` de `title.ilike`, `content.ilike` y `tags.cs` exacto. Añadir la query paralela de `tags` sin paginar y devolver `{ resources, tags, total }`. Actualizar `page.tsx`, `resources.tsx` y montar `ListPagination`.
5. Escapar valores interpolados en `or()`: envolver en comillas dobles, escapar `"` y `\`, y escapar `%` y `_` en el patrón de `ilike`. Cubrirlo con tests unitarios del builder de filtros.
6. Eliminar `utils/filters.ts` y `utils/filters.test.ts` de ambas features tras confirmar que no quedan consumidores.
7. Verificar que los toolbars no preservan `visible` al aplicar filtros: `buildQuery` construye params desde cero, así que el cambio de filtro resetea a 12 sin código extra. Añadir aserción en tests si el toolbar tiene cobertura.
8. CLI: añadir `ListOptions` a `types.ts` y `parseListOptions(args)` a `flags.ts` (`--limit` 1–1000, `--offset` ≥ 0 y exige `--limit`). Cambiar `list(options?)` en `bookmarks-service.ts` y `resources-service.ts` para aplicar `range(offset, offset + limit - 1)` solo si hay límite. Actualizar `commands/bookmark.ts` y `commands/resource.ts`, sus textos de ayuda y sus tests.
9. Actualizar tests de servicios web existentes (mock de InsForge con `range`/`count`) y añadir casos de filtros server-side y total.
10. Ejecutar `pnpm build:web`, `pnpm test:web`, `pnpm test:cli`, `pnpm lint`, `pnpm format:check` y `git diff --check`.

## Criterios de aceptación

**Bookmarks web:**

- [ ] `/bookmarks` sin `?visible` renderiza como máximo 12 bookmarks.
- [ ] El contador muestra `Showing X of Y` con X items cargados e Y el total real de la query.
- [ ] `Load more` incrementa 12 items y actualiza la URL a `?visible=24`, `?visible=36`, etc.
- [ ] Refrescar con `?visible=24` mantiene 24 items cargados.
- [ ] Atrás/adelante del navegador refleja el `visible` correspondiente.
- [ ] El botón `Load more` desaparece cuando X alcanza Y.
- [ ] `?visible=5`, `?visible=abc` y `?visible=0` renderizan 12 items.
- [ ] `?visible=999` renderiza como máximo 96 items.
- [ ] Cambiar búsqueda o categoría resetea a 12 visibles y elimina `visible` de la URL.
- [ ] El filtro `category` se aplica en servidor: con bookmarks de varias categorías, Y cuenta solo los filtrados.
- [ ] `q` matchea `title` y `description` case-insensitive vía `ilike`.
- [ ] `q` matchea un tag solo cuando la query completa es igual al tag (`react` sí, `rea` no).
- [ ] El orden `created_at desc, id desc` es estable entre páginas: no hay filas repetidas ni salteadas al pulsar `Load more`.
- [ ] El botón queda deshabilitado con `aria-busy` durante la transición.
- [ ] El estado vacío existente se muestra cuando Y es 0.

**Resources web:**

- [ ] `/resources` cumple los mismos criterios de paginación, contador, reset y visibilidad del botón.
- [ ] `kind`, `tool` y `tag` se aplican en servidor.
- [ ] `format` se aplica en servidor conservando la semántica actual: `other` incluye `language === "other"` y formatos desconocidos.
- [ ] El dropdown de tags sigue completo independientemente de la página visible.
- [ ] `q` matchea `title` y `content` case-insensitive más tag exacto, con el mismo criterio que bookmarks.

**CLI:**

- [ ] `forge-cli bookmark list` y `forge-cli resource list` sin flags devuelven todas las filas, igual que hoy.
- [ ] `--limit 10` devuelve 10 filas; `--limit 10 --offset 10` devuelve la siguiente página.
- [ ] `--limit 0`, `--limit 1001`, `--limit abc` y `--offset -1` fallan con mensaje claro y exit code 1.
- [ ] `--offset 5` sin `--limit` falla con mensaje claro y exit code 1.
- [ ] `--json` conserva el formato y las claves actuales en list.

**General:**

- [ ] No se modifica ningún archivo bajo `apps/web/src/components/ui`.
- [ ] No hay migraciones, cambios de esquema, RLS ni RPC.
- [ ] Create, update y delete de bookmarks y resources no cambian.
- [ ] `pnpm test:web` pasa.
- [ ] `pnpm test:cli` pasa.
- [ ] `pnpm build:web` termina correctamente.
- [ ] `pnpm lint`, `pnpm format:check` y `git diff --check` terminan correctamente.

## Decisiones

- **Sí:** paginación server-side con `range` y `count` exact en lugar de client-side; la URL es la fuente de verdad y la query escala con el dataset.
- **Sí:** página fija de 12 en bookmarks y resources; un solo tamaño es más simple de razonar y de testear.
- **Sí:** persistir el progreso en `?visible`; refresh y back/forward conservan lo cargado.
- **Sí:** clamp de `visible` a 12–96; valores inválidos caen a 12 para evitar queries gigantes.
- **Sí:** re-fetch de `range(0, visible - 1)` en cada navegación en lugar de acumular en cliente; idempotente, sin estado duplicado y sin sincronización manual.
- **Sí:** `count: "exact"` con contador `Showing X of Y`; permite ocultar el botón con precisión.
- **Sí:** `q` server-side con `ilike` en `title`/`description` (bookmarks) y `title`/`content` (resources), más `tags.cs` con match exacto.
- **No:** substring dentro de tags vía RPC; exigiría migración y BD para un caso marginal.
- **Sí:** dropdown de tags de resources con query aparte sobre todas las filas; mantiene el filtro completo.
- **Sí:** reset a 12 al cambiar filtros; los toolbars ya reconstruyen los params desde cero y `visible` no se preserva.
- **Sí:** fallo de carga apoyado en `error.tsx`; sin código cliente de reintento.
- **Sí:** orden `created_at desc, id desc`; el tiebreak por `id` evita filas repetidas o salteadas entre páginas.
- **Sí:** mover filtros a PostgREST y eliminar `filterBookmarks`/`filterResources`; una sola ruta de filtrado evita divergencias.
- **Sí:** componente compartido `ListPagination` en `apps/web/src/components`; ambos features necesitan exactamente el mismo control.
- **No:** paginación por cursor, scroll infinito o virtualización; el botón fue el requisito explícito.
- **No:** rediseñar toolbar, filtros ni estados vacíos.
- **Sí:** CLI con `--limit`/`--offset` opcionales; sin flags conserva el comportamiento actual y no rompe scripts.
- **Sí:** `--offset` exige `--limit`; evita rangos abiertos con fin arbitrario.
- **No:** límite por defecto o subcomandos interactivos en el CLI.
- **No:** tocar `apps/web/src/components/ui`, migraciones, RLS o RPC.

## Riesgos

| Riesgo                                                                                                | Mitigación                                                                                                                   |
| ----------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Valores de `q` con caracteres reservados de PostgREST (`,`, `(`, `)`, `.`, `%`, `_`) rompen el `or()` | Envolver valores en comillas dobles, escapar `"` y `\`, y escapar `%` y `_` del patrón `ilike`; tests unitarios del builder. |
| `tags.cs` con una query que contiene `{`, `}`, `,` o espacios                                         | Escapar el valor dentro de las llaves y cubrirlo con tests de casos límite.                                                  |
| El `count` exact sobre `ilike` agrega costo en tablas grandes                                         | Aceptado para el volumen personal; si molesta, se cambia a `planned` en una spec futura.                                     |
| Re-render completo de la página en cada `Load more`                                                   | `useTransition` deshabilita el botón y marca `aria-busy`; la re-descarga es barata a esta escala.                            |
| URL manual con `visible` no múltiplo de 12 (p. ej. 18)                                                | Se respeta dentro del rango; `Load more` suma 12 y el contador refleja X real. Comportamiento documentado, no un bug.        |
| Filas empatadas en `created_at` se repiten o saltean entre páginas                                    | Segundo criterio de orden `id desc` en ambas queries.                                                                        |
| `format=other` cambia de semántica al pasar a SQL                                                     | Traducir a `or(language.eq.other, language.not.in.(formatos conocidos))` y cubrir null/desconocidos con tests.               |
| Algún consumidor no detectado de `filterBookmarks`/`filterResources` queda roto                       | Buscar consumidores antes de borrar; services y pages se actualizan en el mismo cambio.                                      |
| Tests de servicios existentes asumen el mock actual de InsForge                                       | Actualizar el mock a la cadena `select().order().range()` con `count` y añadir casos de filtros en el mismo paso.            |
| Toolbar de resources preserva `visible` al filtrar y evita el reset esperado                          | Verificar que `buildQuery` reconstruye params desde cero; añadir aserción si hay cobertura del toolbar.                      |
| `--offset` llega al service sin `--limit` por una ruta no validada                                    | El command valida antes de llamar; el service ignora `offset` si no hay `limit`, como defensa en profundidad.                |

## Qué **no** está en esta spec

- Paginación por cursor, keyset, scroll infinito o virtualización.
- Nuevas opciones de orden o cambios al orden existente.
- Full-text search con `tsvector`, RPC o migraciones.
- Cambios a create, update, delete, dialogs, actions o RLS.
- Rediseño del toolbar o de los filtros.
- Paginación por defecto o modo interactivo en el CLI.
- Cambios a otros consumidores de los servicios.
- Modificación de componentes bajo `apps/web/src/components/ui`.

Cada elemento futuro deberá definirse en su propia spec.

# SPEC 06 — Editar bookmarks y snippets con menú de acciones

> **Status:** Implemented
> **Depends on:** Ninguna
> **Date:** 2026-07-19
> **Objective:** En la web, reemplazar el botón de eliminar de las cards de bookmark y snippet por un menú `⋯` siempre visible con Edit y Delete, e implementar edición completa vía dialog dedicado (sin tocar `id` ni `createdAt`).

## Alcance

**Incluye:**

- En `bookmark-card` y `snippet-card`: quitar el botón `Trash2` y poner un menú `⋯` (`MoreHorizontal`) siempre visible con `DropdownMenu`.
- Opciones del menú: **Edit** y **Delete** (solo esas).
- Dialogs de create separados de edit:
  - Bookmarks: mantener `add-bookmark-dialog.tsx`; nuevo `edit-bookmark-dialog.tsx`.
  - Snippets: mantener `add-snippet-dialog.tsx`; nuevo `edit-snippet-dialog.tsx`.
- Edit abre el dialog prellenado; campos editables:
  - Bookmark: `title`, `url`, `category`, `description`, `tags`
  - Snippet: `title`, `kind`, `content`, `language`, `tags`
  - No editables: `id`, `createdAt`
- Persistencia: `updateBookmark` / `updateSnippet` en servicios + mutations TanStack Query (toasts de éxito/error).
- Delete: confirmación con el mismo patrón que proyectos del Dev Board (Dialog Cancel / Delete) antes de llamar a la mutation existente.
- Tests unitarios de update en servicios (Vitest, sin Appwrite real).

**Fuera de alcance (specs futuras):**

- CLI / skills de agentes.
- Más opciones en el menú (copiar, abrir, compartir, etc.).
- Cambiar esquema Appwrite o modelo de datos.
- Soft-delete, historial de versiones, o edición inline en la card.
- Cambios en otras features.

## Modelo de datos

Esta feature no introduce estructuras nuevas. Reutiliza `Bookmark` y `Snippet` existentes. Update solo muta los campos del form; `id` y `createdAt` no cambian.

```ts
// apps/web/src/features/bookmarks/types/index.ts
type Bookmark = {
  id: string;
  title: string;
  url: string;
  category: Category; // "docs" | "git" | "tool" | "article" | "other"
  description: string;
  tags: string[];
  createdAt: string;
};

// apps/web/src/features/snippets/types/index.ts
type Snippet = {
  id: string;
  title: string;
  kind: SnippetKind; // "note" | "prompt" | "config" | "snippet"
  content: string;
  language: string | null;
  tags: string[];
  createdAt: string;
};

// Payload de update (sin id / createdAt)
type BookmarkUpdate = Omit<Bookmark, "id" | "createdAt">;
type SnippetUpdate = Omit<Snippet, "id" | "createdAt">;
```

Validación: mismos schemas Zod de create (`bookmarksSchema`, `snippetSchema`). Persistencia Appwrite igual que hoy (tabla bookmarks / collection genérica de snippets); solo se añade `updateRow` / update del payload.

## Plan de implementación

1. Añadir `updateBookmark` en `bookmarks-service.ts` (Appwrite `updateRow` con los campos del form) y tests en `bookmarks-service.test.ts`.
2. Añadir `useUpdateBookmarkMutation` en `bookmarks/hooks/mutations.ts` (invalidate queries + toasts).
3. Crear `edit-bookmark-dialog.tsx` (mismo form/validación que add, prellenado, submit → update). Wire desde el padre cuando haya target de edición.
4. En `bookmark-card.tsx`: reemplazar `Trash2` por menú `⋯` (Edit / Delete). Edit abre el dialog; Delete pide confirmación (patrón Dev Board projects) y luego llama a `useDeleteBookmarkMutation`.
5. Añadir `updateSnippet` en `snippets-service.ts` (+ helper de update en `appwrite-data` si hace falta) y tests en `snippets-service.test.ts`.
6. Añadir `useUpdateSnippetMutation` en `snippets/hooks/mutations.ts`.
7. Crear `edit-snippet-dialog.tsx` (mismo criterio que bookmark) y cablearlo.
8. En `snippet-card.tsx`: mismo menú `⋯` + confirmación de delete + Edit.

Cada paso deja la app usable; create/delete existentes no se rompen.

## Criterios de aceptación

- [ ] En cada card de bookmark y snippet el botón `Trash2` ya no aparece; hay un `⋯` siempre visible.
- [ ] Al abrir el menú solo aparecen **Edit** y **Delete**.
- [ ] **Edit** (bookmark) abre `edit-bookmark-dialog` prellenado; se pueden cambiar `title`, `url`, `category`, `description`, `tags`; al guardar, la lista refleja los cambios sin recargar la página.
- [ ] **Edit** (snippet) abre `edit-snippet-dialog` prellenado; se pueden cambiar `title`, `kind`, `content`, `language`, `tags`; al guardar, la lista refleja los cambios sin recargar la página.
- [ ] `id` y `createdAt` no se modifican tras un update exitoso.
- [ ] Create sigue funcionando con `add-bookmark-dialog` / `add-snippet-dialog` sin regresión.
- [ ] **Delete** abre dialog de confirmación (Cancel / Delete); Cancel no borra; Delete confirma y elimina el ítem.
- [ ] Fallo de update o delete muestra toast de error; éxito muestra toast de éxito.
- [ ] Tests de `updateBookmark` y `updateSnippet` pasan con Vitest (sin Appwrite real).

## Decisiones

- **Sí:** Menú `⋯` siempre visible con Edit + Delete. Sustituye el icono trash directo.
- **Sí:** Dialogs separados `add-*` y `edit-*` (no un solo dialog con modo). Claridad y renombres permitidos si hace falta.
- **Sí:** Todos los campos del form editables; `id` y `createdAt` inmutables.
- **Sí:** Confirmación de delete con el mismo patrón que proyectos del Dev Board.
- **Sí:** Solo `apps/web` (bookmarks + snippets).
- **No:** Unificar create/edit en un dialog con prop `mode`. El usuario pidió dialogs propios.
- **No:** Más acciones en el menú (copiar, abrir, etc.). Otro spec si llegan.
- **No:** CLI / skills. Fuera de alcance.
- **No:** Cambiar esquema Appwrite. Solo update de filas/payload existentes.

## Riesgos

| Riesgo                                           | Mitigación                                                                                                                                                           |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Permisos Appwrite sin `update` en filas antiguas | Create ya setea `Permission.update` para el user; si una fila legacy falla, el toast de error lo muestra y se puede recrear/re-guardar.                              |
| Duplicación de form entre `add-*` y `edit-*`     | Mismo schema Zod y mismos campos; divergencia solo en título, defaults y mutation. No extraer shared form en este spec salvo que el duplicado sea trivial de evitar. |
| Clic accidental en Delete                        | Confirmación obligatoria (Cancel / Delete) antes de mutar.                                                                                                           |

## Qué **no** está en esta spec

- CLI (`forge-cli`) ni skills de agentes.
- Más opciones en el menú (copiar, abrir, compartir, etc.).
- Cambios de esquema Appwrite o nuevos campos.
- Soft-delete, historial de versiones, edición inline.
- Un solo dialog create/edit con prop `mode`.
- Cambios en otras features fuera de bookmarks y snippets.

Cada uno de esos, si entra, va en su propia spec.

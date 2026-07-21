# SPEC 08 — Resources: configuraciones y recursos de desarrollo

> **Estado:** Implemented
> **Depende de:** SPEC 06 — Editar bookmarks y snippets con menú de acciones
> **Fecha:** 2026-07-20
> **Objetivo:** Convertir la herramienta Snippets en Resources bajo `/resources`, conservar sus recursos actuales y añadir configuraciones reutilizables de librerías y herramientas con metadatos, búsqueda, edición y copia.

## Alcance

**Incluye:**

- Renombrar la herramienta visible `Snippets` a `Resources`.
- Crear la ruta autenticada `/resources` y eliminar `/snippets`.
- Actualizar `tools.ts`, navegación, botones, enlaces, metadata y textos para que no apunten a `/snippets`.
- Conservar recursos existentes de tipo `note`, `prompt`, `config` y `snippet`.
- Mantener la tabla `snippets` y ampliar sus registros con metadatos opcionales:
  - herramienta objetivo;
  - nombre personalizado cuando la herramienta sea `Other`;
  - versión;
  - contexto libre.
- Mantener `kind: "config"` como tipo interno.
- Mantener `language` como campo persistido y mostrarlo como `Format`.
- Añadir formatos controlados: JSON, YAML, JavaScript, TypeScript, Markdown, ENV, Plain text y `Other`.
- Hacer obligatoria la herramienta objetivo al crear una nueva configuración.
- Extender los dialogs actuales de alta y edición con campos condicionales para configuraciones.
- Mostrar en las tarjetas tipo, herramienta, versión, formato y tags cuando existan.
- Buscar en título, contenido y tags.
- Filtrar por tipo, herramienta, formato y tags.
- Mantener crear, editar, eliminar, copiar y generación actual con IA.
- Persistir datos en InsForge para el usuario autenticado.
- Mantener acceso privado por usuario mediante las políticas existentes.
- Añadir tests, ejecutar build y lint, y verificar manualmente navegación y operaciones CRUD.

**Fuera de alcance para specs futuras:**

- Archivos binarios, adjuntos o almacenamiento de archivos.
- Importación y exportación de configuraciones.
- Aplicación automática de configuraciones en otros proyectos.
- Sincronización con VS Code, Cursor, OpenCode, Claude Code o proyectos externos.
- Compartir recursos mediante enlaces públicos o espacios de equipo.
- Relación formal con proyectos del Dev Board; el contexto seguirá siendo texto libre.
- Generación con IA específica para configuraciones.
- Renombrar carpeta interna `snippets`, servicios, componentes, tipos o tabla backend.
- Cambios en Bookmarks, CLI o MCP.
- Redirección o compatibilidad de `/snippets`; la ruta anterior se eliminará.

## Modelo de datos

La feature no crea una tabla nueva. Amplía `public.snippets` y conserva los tipos internos actuales para no migrar ni perder recursos existentes.

```ts
type SnippetKind = "note" | "prompt" | "config" | "snippet";

type SnippetTool = "react-native" | "vscode" | "cursor" | "opencode" | "claude-code" | "other";

interface Snippet {
  id: string;
  title: string;
  kind: SnippetKind;
  content: string;
  language: string | null; // Se muestra como "Format".
  tags: string[];
  tool: SnippetTool | null;
  customTool: string | null;
  version: string | null;
  context: string | null;
  createdAt: string;
}
```

La migración añade estas columnas opcionales a `public.snippets`:

```sql
tool TEXT NULL,
custom_tool TEXT NULL,
version TEXT NULL,
context TEXT NULL
```

Reglas:

- Los recursos actuales reciben `NULL` en los campos nuevos.
- `tool` acepta `react-native`, `vscode`, `cursor`, `opencode`, `claude-code` u `other`.
- Cuando `tool = 'other'`, `custom_tool` es obligatorio para nuevos recursos.
- Cuando `kind = 'config'`, `tool` es obligatorio en alta y edición.
- `version` y `context` son opcionales.
- `language` conserva el formato persistido y se presenta como `Format`.
- Los formatos iniciales son JSON, YAML, JavaScript, TypeScript, Markdown, ENV, Plain text y `Other`.
- Para tipos distintos de `config`, los campos de configuración permanecen en `NULL` y no aparecen en el formulario.
- Las políticas RLS existentes permanecen sin cambios: cada usuario solo accede a sus propios registros.

## Plan de implementación

1. Crear una migración SQL nueva en `migrations/` que añada `tool`, `custom_tool`, `version` y `context` a `public.snippets`, manteniendo todas las columnas nuevas opcionales y las políticas RLS existentes. Aplicarla en InsForge; la aplicación seguirá funcionando con los registros actuales.
2. Ampliar `apps/web/src/features/snippets/types/index.ts` y `apps/web/src/features/snippets/constants/index.tsx` con los tipos y opciones de herramientas y formatos definidos en el modelo.
3. Actualizar `apps/web/src/features/snippets/schemas/snippet-schema.ts` para validar campos condicionales: una nueva configuración requiere herramienta, `Other` requiere nombre personalizado y los límites de texto existentes se mantienen.
4. Actualizar `apps/web/src/features/snippets/services/snippets-service.ts` para seleccionar, transformar, crear y actualizar los metadatos nuevos. Ampliar `snippets-service.test.ts` para cubrir recursos antiguos, configuraciones completas y validación de campos opcionales.
5. Actualizar `apps/web/src/features/snippets/components/add-snippet-dialog.tsx` con el selector de formato, herramienta, nombre personalizado, versión y contexto. Mostrar los campos de configuración solo cuando `kind` sea `config` y conservar la generación actual con IA.
6. Actualizar `apps/web/src/features/snippets/components/edit-snippet-dialog.tsx` con los mismos campos y reglas, rellenando correctamente valores `NULL` de recursos existentes.
7. Actualizar `apps/web/src/features/snippets/snippets.tsx` para presentar Resources, buscar en título, contenido y tags, filtrar por tipo, herramienta, formato y tags, y conservar estados de carga, error, vacío, creación y borrado.
8. Actualizar `apps/web/src/features/snippets/components/snippet-card.tsx` para mostrar tipo, herramienta, versión, formato y tags cuando existan, manteniendo edición, eliminación y copia del contenido.
9. Crear `apps/web/src/app/(authenticated)/resources/page.tsx` y eliminar `apps/web/src/app/(authenticated)/snippets/page.tsx`. Mantener la feature interna `snippets` y sus nombres de implementación para evitar una migración innecesaria.
10. Actualizar `apps/web/src/lib/tools.ts`, la navegación, metadata y cualquier enlace para usar el nombre `Resources` y la ruta `/resources`. Buscar referencias restantes a `/snippets` y eliminarlas; no crear redirección.
11. Ejecutar tests unitarios del feature, `pnpm build` y `pnpm lint`, y hacer una revisión manual autenticada de la ruta, búsqueda, filtros, alta, edición, copia y borrado.

## Criterios de aceptación

- [ ] Un usuario autenticado puede abrir `/resources` y ve la herramienta con nombre `Resources`.
- [ ] La ruta `/snippets` no existe y ninguna navegación o acción de la aplicación dirige a ella.
- [ ] `tools.ts` registra la herramienta con ruta `/resources`, nombre `Resources` y descripción actualizada.
- [ ] Los recursos existentes de tipo `note`, `prompt`, `config` y `snippet` siguen apareciendo sin pérdida de contenido, tags ni fecha.
- [ ] Los recursos existentes con campos nuevos `NULL` cargan y editan sin error.
- [ ] Al crear un recurso de tipo `config`, seleccionar una herramienta es obligatorio.
- [ ] Al seleccionar `Other`, aparece un campo obligatorio para el nombre personalizado de la herramienta.
- [ ] Versión y contexto pueden dejarse vacíos y se guardan como `NULL`.
- [ ] Los campos de herramienta, versión y contexto solo aparecen cuando el tipo es `config`.
- [ ] El selector de formato ofrece JSON, YAML, JavaScript, TypeScript, Markdown, ENV, Plain text y `Other`.
- [ ] Las tarjetas muestran tipo, herramienta, versión, formato y tags cuando esos valores existen.
- [ ] La búsqueda encuentra recursos por coincidencias en título, contenido y tags.
- [ ] Los filtros permiten restringir resultados por tipo, herramienta, formato y tags.
- [ ] Crear, editar y eliminar recursos conserva el comportamiento actual y persiste los cambios en InsForge.
- [ ] Copiar un recurso coloca exactamente su contenido en el portapapeles.
- [ ] La generación actual con IA del formulario sigue funcionando para el flujo existente.
- [ ] Un usuario autenticado solo puede consultar y modificar sus propios recursos.
- [ ] No se guardan archivos binarios ni adjuntos.
- [ ] Los tests unitarios nuevos y existentes del feature pasan con Vitest.
- [ ] `pnpm build` termina correctamente.
- [ ] `pnpm lint` termina correctamente.
- [ ] La revisión manual confirma navegación, carga, búsqueda, filtros, alta, edición, copia y borrado en `/resources`.

## Decisiones

- **Sí:** Convertir la herramienta visible `Snippets` en `Resources`; representa notas, prompts, snippets y configuraciones.
- **Sí:** Usar `/resources` como ruta pública nueva.
- **Sí:** Eliminar `/snippets` sin redirección; la aplicación no debe seguir apuntando a esa ruta.
- **Sí:** Conservar `features/snippets`, servicios, componentes, tipos internos y tabla `snippets`; reduce riesgo y evita migrar datos innecesariamente.
- **Sí:** Ampliar la tabla `snippets` en lugar de crear una tabla `resources`; los recursos comparten ciclo de vida y permisos.
- **Sí:** Mantener `kind: "config"`; evita migrar recursos existentes.
- **Sí:** Reutilizar `language` como campo persistido y mostrarlo como `Format`; evita duplicar conceptos en el modelo.
- **Sí:** Mostrar herramienta, nombre personalizado, versión y contexto solo para configuraciones.
- **Sí:** Hacer obligatoria la herramienta para nuevas configuraciones; evita registros sin contexto mínimo.
- **Sí:** Usar lista controlada de herramientas con `Other` y nombre personalizado; mantiene consistencia y permite casos futuros.
- **Sí:** Mantener versión y contexto como texto opcional; no crea dependencia con Dev Board.
- **Sí:** Extender dialogs existentes; evita duplicar validación y experiencia.
- **Sí:** Mantener crear, editar, eliminar, copiar y generación actual con IA; el cambio amplía la herramienta sin quitar capacidades.
- **Sí:** Persistir exclusivamente en InsForge con RLS por usuario; conserva el patrón actual de la aplicación.
- **Sí:** Buscar en título, contenido y tags, con filtros por tipo, herramienta, formato y tags; permite encontrar configuraciones reutilizables.
- **No:** Crear una herramienta o tabla independiente de configuraciones; duplicaría recursos y lógica.
- **No:** Renombrar toda la implementación interna a `resources`; no aporta valor visible y aumenta el alcance.
- **No:** Crear redirección desde `/snippets`; la decisión es retirar la ruta antigua.
- **No:** Guardar archivos binarios o adjuntos; v1 se limita a texto.
- **No:** Importar, exportar, sincronizar o aplicar configuraciones automáticamente; cada capacidad requiere otra spec.
- **No:** Compartir recursos públicamente o por equipos; v1 es privado por usuario.
- **No:** Relacionar configuraciones con proyectos del Dev Board; `context` será texto libre.
- **No:** Ampliar generación con IA para configuraciones; solo se conserva el flujo existente.

## Riesgos

| Riesgo                                                                                     | Mitigación                                                                                                                        |
| ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Quedan enlaces o botones apuntando a `/snippets` después del cambio de ruta.               | Buscar referencias en todo el repositorio, actualizar `tools.ts` y navegación, y comprobar manualmente cada entrada de Resources. |
| Recursos existentes fallan al leer porque no tienen los campos nuevos.                     | Añadir columnas opcionales, mapear `NULL` y cubrir registros antiguos en tests del servicio.                                      |
| Configuraciones antiguas tienen `kind = "config"` pero no tienen herramienta.              | Permitir lectura y edición de esos registros; exigir herramienta solo al guardar una configuración nueva o editada.               |
| Valores actuales de `language` no coinciden con la nueva lista de formatos.                | Conservar el valor persistido y mostrarlo como `Other` cuando no pertenezca a la lista.                                           |
| Buscar dentro de contenido puede degradar con muchos recursos o contenidos grandes.        | Mantener búsqueda local limitada al conjunto cargado en v1 y dejar paginación o búsqueda server-side para otra spec.              |
| La migración o los nuevos campos rompen el flujo de creación, edición o generación con IA. | Añadir tests de schema y servicio, conservar los dialogs actuales y verificar manualmente alta y edición de todos los tipos.      |
| Eliminar `/snippets` rompe enlaces externos existentes.                                    | Aceptar explícitamente la eliminación como decisión de producto y asegurar que toda navegación interna usa `/resources`.          |

## Qué **no** está en esta spec

- Archivos binarios, adjuntos o almacenamiento de archivos.
- Importación y exportación de configuraciones.
- Aplicación automática o sincronización de configuraciones con otros proyectos y herramientas.
- Compartir recursos públicamente o mediante espacios de equipo.
- Relación formal con proyectos del Dev Board.
- Generación con IA específica para configuraciones.
- Renombrado interno de la feature `snippets`, sus servicios o la tabla backend.
- CLI, MCP, Bookmarks u otras features no relacionadas.
- Redirección o compatibilidad de `/snippets`.

Cada elemento futuro deberá definirse en su propia spec.

# Roadmap de mejoras — Forge

> Complementa `docs/product.md` (visión) y `docs/IDEAS.md` (brainstorm de módulos). Forge es web-first: desktop, CLI, MCP y móvil se añaden después sobre APIs y modelos compartidos.

## 1. Estado actual

Las herramientas viven en `apps/web/src/lib/tools.ts`. Dos niveles de madurez:
- **Tools simples**: un archivo `.tsx` + `utils/` (json-formatter, base64, uuid-generator, etc.)
- **Features completos**: `components/hooks/services/schemas/types` (bookmarks, dev-board, mock-data-generator, http-tester, auth, settings)

### Restricciones web

| Tool | Restricción | Comportamiento web |
|---|---|---|
| file-validator | Browser File API | Selección y hashing local de archivos |
| image-tools | Browser File API | Drag and drop y Canvas local |
| http-tester | CORS del navegador | Explica errores CORS; no los evita |
| color-converter | Selector de color HTML | Conversión y paletas en navegador |
| dev-board | Permiso de notificaciones | Usa Notification API si ya fue concedido |

Resto (json-formatter, uuid-generator, base64, timestamp-converter, jwt-decoder, regex-tester, hash-generator, qr-generator, text-manipulator, url-encoder, format-converter, diff-tool, lorem-ipsum, json-to-typescript, html-entities, mock-data-generator) — 100% client-side, web-ready tal cual.

**Persistencia**: bookmarks y snippets usan Appwrite. El resto de utilidades locales usan almacenamiento del navegador hasta que el modelo de workspaces exista.

## 2. Estrategia web-first

- Mantener `apps/web` como única aplicación hasta que una segunda app tenga consumidor real.
- Modelar organizaciones, workspaces, miembros, roles, proyectos, tareas y entradas de tiempo en Appwrite antes de añadir CLI o MCP.
- Exponer API autenticada con scopes y registro de auditoría antes de automatizar mutaciones por agentes.
- Añadir `apps/cli` y MCP stdio sobre misma API cuando Dev Board remoto sea estable.
- Evaluar `apps/desktop` solo para capacidades locales que no existen en navegador.

## 3. Mejoras transversales

- **Error boundaries** — no existe ninguno hoy; una excepción en cualquier tool tumba toda la app. Agregar `errorComponent` en rutas TanStack Router.
- **Favoritos/recientes** — no existen. Command palette solo busca y navega.
- **Tests** — cero. Empezar por `utils/` puros (parsers/converters): alto valor, bajo costo, Vitest.
- **Atajos por herramienta** — hoy solo Cmd+K / Cmd+/ globales.
- **i18n** — UI en inglés, docs en español. Decidir idioma único o agregar i18n real.
- **Limpieza** — carpeta vacía `src/features/types/`; README raíz de 378B sin contenido real.

## 4. Mejoras a herramientas existentes

- **json-formatter**: tree view, JSONPath/jq query, sort keys, soporte JSON5.
- **base64**: archivos/imágenes vía drag-drop, variante URL-safe.
- **jwt-decoder**: verificación de firma HS256 (secret local), indicador visual de expiración.
- **http-tester**: colecciones guardadas, environments/variables, helpers de auth (ya en IDEAS.md — subir prioridad).
- **image-tools**: romper el monolito de 19K líneas en components/hooks; agregar resize y crop.
- **diff-tool**: diff a nivel palabra/carácter, vista side-by-side.
- **regex-tester**: librería de patrones comunes, explicación en texto del patrón.
- **color-converter**: generador de paletas/armonías, chequeo de contraste WCAG.
- **hash-generator**: HMAC, comparación de dos hashes.
- **settings**: exportar/importar configuración completa.

## 5. Features nuevos propuestos

No duplican IDEAS.md (clipboard manager, port scanner, .env manager, etc. — ver ese doc):

- Cron expression parser/explainer
- SQL formatter
- cURL ↔ código (fetch/axios/etc.)
- Markdown preview/editor
- Conversor de base numérica (bin/hex/oct/dec)
- String escape/unescape (JSON, HTML, shell)
- Decoder de certificado X.509
- Calculadora de chmod/permisos
- Generador de slugs
- Inspector ASCII/Unicode

## 6. Prioridad sugerida

- **P0**: Dev Board remoto con workspaces, entradas de tiempo y permisos Appwrite.
- **P1**: reportes, favoritos/recientes, mejoras a json-formatter y HTTP Tester.
- **P2**: API para CLI/MCP, PWA, tests y herramientas nuevas pequeñas.

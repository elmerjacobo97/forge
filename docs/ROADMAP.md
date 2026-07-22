# Roadmap de mejoras — Forge

> Complementa `docs/product.md` (visión) y `docs/IDEAS.md` (brainstorm de módulos). Forge es browser-only: `apps/cli` ya existe sobre la misma API Appwrite; MCP y móvil se añaden después sobre esos mismos modelos compartidos. `apps/desktop` está descartado salvo necesidad real (ver §2).

## 1. Estado actual

El workspace ya tiene tres paquetes reales, no solo `apps/web`:
- `apps/web` (`@forge/web`) — la app browser, herramientas en `apps/web/src/lib/tools.ts`.
- `apps/cli` (`@codigoconelmer/forge-cli`, binario `forge-cli`) — CRUD de bookmarks/proyectos/tickets sobre las mismas tablas InsForge que usa la web.
- `functions/ai-content-generator` (`@forge/ai-content-generator`) — Appwrite Function (Groq) que genera contenido; consumida hoy por `features/ai-generation`.

Las herramientas de `apps/web` tienen dos niveles de madurez:
- **Tools simples**: un archivo `.tsx` + `utils/` (json-formatter, base64, uuid-generator, etc.)
- **Features completos**: `components/hooks/services/schemas/types` (bookmarks, dev-board, mock-data-generator, http-tester, auth, settings, y **ai-generation** — usado transversalmente dentro de bookmarks y snippets, no es una tool con ruta propia).

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

- Mantener `apps/web` como única app de UI hasta que una segunda tenga consumidor real. `apps/cli` y `functions/ai-content-generator` ya son parte del workspace, no una app de UI competidora.
- Modelar organizaciones, workspaces, miembros, roles, proyectos, tareas y entradas de tiempo en Appwrite antes de dar permisos multi-usuario reales (Team workspaces).
- Exponer API autenticada con scopes y registro de auditoría antes de automatizar mutaciones por agentes.
- `apps/cli` (`forge-cli`) ya existe y cubre bookmarks/proyectos/tickets. Pendiente: **MCP stdio sobre la misma API** para que agentes operen Forge directamente.
- `apps/desktop` queda descartado mientras Forge sea browser-only (regla dura en `AGENTS.md`, no dependencias Tauri/Rust/native-IPC). Solo reconsiderar si aparece una necesidad real que el navegador no pueda cubrir (ver sección "Descartado" en `docs/IDEAS.md`).

## 3. Mejoras transversales

- **Error boundaries** — no existe ninguno hoy; una excepción en cualquier tool tumba toda la app. Agregar `errorComponent` en rutas TanStack Router.
- **Favoritos/recientes** — no existen. Command palette solo busca y navega.
- **Tests** — cero. Empezar por `utils/` puros (parsers/converters): alto valor, bajo costo, Vitest.
- **Atajos por herramienta** — hoy solo Cmd+K / Cmd+/ globales.
- **i18n** — UI en inglés, docs en español. Decidir idioma único o agregar i18n real.
- **Limpieza** — carpetas basura en `apps/web/src/features/`: `types/` (vacía), `src/` (vacía), `node_modules/` (solo un cache `.vite` perdido ahí); README raíz de 378B sin contenido real.

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

No duplican IDEAS.md (webhook inspector, feature flags, secrets vault, etc. — ver ese doc):

- Cron expression parser/explainer
- SQL formatter
- cURL ↔ código (fetch/axios/etc.) — versión determinista; versión IA-asistida en IDEAS.md
- Markdown preview/editor
- Conversor de base numérica (bin/hex/oct/dec)
- String escape/unescape (JSON, HTML, shell)
- Decoder de certificado X.509
- Calculadora de chmod/permisos
- Generador de slugs
- Inspector ASCII/Unicode
- MCP server sobre `forge-cli`/API Appwrite (ver IDEAS.md) — expone bookmarks/proyectos/tickets a agentes de IA.
- Team workspaces (Appwrite Teams) para Dev Board/bookmarks/snippets compartidos — habilita el tier "Empresas" de `product.md`.

## 6. Prioridad sugerida

- **P0**: Saved HTTP collections (extiende HTTP Tester) y Webhook inspector — diferenciadores que aprovechan feature/infra ya existente.
- **P1**: Team workspaces (habilita monetización Empresas), favoritos/recientes, reportes, mejoras a json-formatter y HTTP Tester, IA-asistida en regex/cURL/mock-data (infra Groq ya existe).
- **P2**: MCP sobre `forge-cli`, PWA, tests y herramientas nuevas pequeñas.

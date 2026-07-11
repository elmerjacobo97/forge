# Roadmap de mejoras — Forge

> Complementa `docs/product.md` (visión) y `docs/IDEAS.md` (brainstorm de módulos). Este doc nace de una revisión de código (jul 2026) y se enfoca en: mejoras transversales, mejoras a herramientas existentes, features nuevos, y el requisito de soportar **escritorio + web**.

## 1. Estado actual

23 herramientas en `src/lib/tools.ts`. Dos niveles de madurez:
- **Tools simples**: un archivo `.tsx` + `utils/` (json-formatter, base64, uuid-generator, etc.)
- **Features completos**: `components/hooks/services/schemas/types` (git-commit, bookmarks, dev-board, mock-data-generator, http-tester, auth, settings)

### Dependencias de Tauri (bloquean versión web)

| Tool | Comando Rust / plugin | Bloqueo |
|---|---|---|
| git-commit | `git_status`, `git_diff`, `git_commit`, `git_add`, `git_unstage` + `plugin-dialog` | Total — requiere shell a `git` |
| file-validator | `hash_file` | Parcial — File System Access API cubriría web |
| image-tools | `read_file_bytes` | Parcial — drag-drop + File API cubre web |
| http-tester | `plugin-http` (bypass CORS) | Parcial — en web pega con CORS del navegador |
| color-converter | `pick_color` (macOS-only eyedropper) | Parcial — `EyeDropper` API cubre Chrome/Edge |
| dev-board | `plugin-notification` | Parcial — Notification API cubre web |

Resto (json-formatter, uuid-generator, base64, timestamp-converter, jwt-decoder, regex-tester, hash-generator, qr-generator, text-manipulator, url-encoder, format-converter, diff-tool, lorem-ipsum, json-to-typescript, html-entities, mock-data-generator) — 100% client-side, web-ready tal cual.

**Persistencia**: todo pasa por `@tauri-apps/plugin-store` (git-commit repos, settings, bookmarks, mock-data presets, dev-board, http-tester history). Sin abstracción — bloqueo duro para web.

## 2. Estrategia escritorio + web

### Capa de plataforma (`src/lib/platform/`)
- `isTauri()` — detecta runtime.
- **Storage adapter**: interfaz única; backend `plugin-store` (desktop) o `localStorage`/IndexedDB (web). Migrar los 6 usos actuales detrás de esta interfaz.
- **Notificaciones**: `plugin-notification` (desktop) / Notification API (web).
- **Fetch**: `plugin-http` (desktop) / fetch nativo + aviso de CORS (web).
- **Eyedropper**: `pick_color` (desktop) / `EyeDropper` API (web, Chrome/Edge).

### Gating por herramienta
Añadir `platforms: ('desktop' | 'web')[]` a `ToolDef`. Sidebar y command palette filtran según plataforma activa. git-commit queda desktop-only; file-validator/image-tools/color-converter degradan con capacidad reducida en web.

### Build web
`pnpm build` ya genera `dist/` — falta: hosting, y evitar imports incondicionales de Tauri (deep-link, tray-menu) cuando corre en navegador.

## 3. Mejoras transversales

- **Error boundaries** — no existe ninguno hoy; una excepción en cualquier tool tumba toda la app. Agregar `errorComponent` en rutas TanStack Router.
- **Auto-update** — falta `tauri-plugin-updater`; product.md promete updates frecuentes sin mecanismo real.
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

- **P0**: abstracción de plataforma + storage adapter (desbloquea web), error boundaries.
- **P1**: gating por plataforma, favoritos/recientes, mejoras a json-formatter y http-tester.
- **P2**: auto-updater, tests, herramientas nuevas pequeñas.

# Ideas de funcionalidades

> Lluvia de ideas para módulos futuros de Forge. No es roadmap ni spec, solo un registro de posibilidades a explorar. Filtrar y priorizar cuando se defina roadmap.

Forge es browser-only (ver `AGENTS.md`): nada de Tauri/Rust/native-IPC. Organizadas por dependencia de backend/browser API.

---

## Ya hecho (dejar de tratar como idea)

- **Auth + session** — `features/auth`, login/register/logout sobre Appwrite.
- **Cloud sync de snippets / bookmarks** — ya viven en Appwrite, multi-device por diseño.
- **Image tools** — ya existe, 100% browser/Canvas (no Rust `image` crate como se planteaba originalmente).
- **CLI** (`forge-cli`, `apps/cli`) — ya existe: bookmark/project/ticket CRUD sobre las mismas tablas Appwrite que usa la web. Ya no es dependencia bloqueante para nada de esta lista.
- **Generación asistida por IA** (`functions/ai-content-generator`, Appwrite Function + Groq) — ya integrada en bookmarks y snippets vía `features/ai-generation` (botón de autocompletar).

---

## Web viable (browser API, sin backend)

### File hasher — mejora de streaming
- Extender `file-validator` existente con streaming en el navegador (Web Streams / chunked `crypto.subtle.digest`) para archivos grandes, sin bloquear el main thread.

### Local dev-server monitor
- Dashboard de "está vivo localhost:3000/8080/etc." con pings via `fetch`. No requiere nada nativo, solo ojo con CORS/mixed-content en `https://`.

### Env / .env manager
- Editor con validación, secrets masking, export a dotenv.
- Viable en navegador vía **File System Access API** (Chrome/Edge) para leer/escribir el archivo local con permiso explícito del usuario — no requiere FS nativo Rust. Degradar a copy/paste en navegadores sin soporte (Safari/Firefox).

---

## IA, ya con infra lista (Appwrite Function + Groq)

Aprovechar el patrón ya construido en `features/ai-generation` en vez de levantar infra nueva:

- **Regex Tester**: explicación del patrón en lenguaje natural.
- **cURL ↔ código**: generación asistida (fetch/axios/httpie/etc.), no solo parsing determinista.
- **Mock Data Generator**: describir el shape deseado en lenguaje natural → schema JSON.
- **Auto-resumen / auto-tag**: extender el autocompletado ya usado en bookmarks/snippets a otras herramientas con contenido libre.

---

## Con backend (UI-first, conectar después)

### API key / secrets vault
- Store encrypted en backend.
- Forge UI lista, rota, copia con TTL.
- Mejor que `.env` suelto.

### Team workspace
- Snippets/bookmarks/Dev Board compartidos, templates, permisos. Invite flow sobre Appwrite Teams.
- Habilita el tier "Empresas" de `product.md`.

### Saved HTTP requests collections
- Extender `http-tester` existente.
- Backend persiste collections tipo Postman: folders, envs (dev/staging/prod), variables.
- Valor alto porque ya hay feature base — subir prioridad.

### Webhook inspector
- Tipo webhook.site. Backend (Appwrite Function) genera URL única, recibe requests.
- Forge muestra en tiempo real mediante Appwrite Realtime o polling.
- Killer feature para devs. Diferenciador fuerte.

### Cron / scheduled jobs viewer
- Backend corre jobs. Forge dashboard con logs, next-run, retry.
- UI lista para cuando exista el scheduler.

### Feature flags dashboard
- Toggle flags por env / user, sobre una colección Appwrite.
- Conecta a backend config. UI liviana, mucho valor.

### DB browser remoto
- Conectar a DB via backend proxy.
- Tablas, queries, results. Tipo TablePlus lite.

### Logs / observability viewer
- Backend stream logs. Forge tail en vivo con filter / level.
- Tipo console.log pero estructurado.

### MCP server sobre forge-cli / Appwrite API
- Mismo API que ya consume `forge-cli`, expuesto como MCP stdio.
- Permite que agentes de IA operen bookmarks/proyectos/tickets directamente.

---

## Descartado (requiere desktop, viola regla browser-only de `AGENTS.md`)

Estas ideas necesitan Tauri/Rust/APIs nativas del sistema operativo. Fuera de alcance mientras Forge sea browser-only. Si en el futuro se justifica una `apps/desktop`, revisar esta lista primero.

### Clipboard manager
- Historial local usando `tauri-plugin-clipboard`. Sin equivalente browser API con el mismo alcance (no hay acceso a historial de portapapeles del sistema).

### Global hotkey + system tray
- `tauri-plugin-global-shortcut` + `tauri-plugin-tray` para abrir Forge desde cualquier app y mantenerlo en background. Requiere proceso nativo corriendo.

### Port scanner local
- Rust `std::net` para revisar puertos ocupados. El navegador no tiene acceso a sockets TCP crudos.

### OCR screenshot
- `tauri-plugin-screencapture` + Tesseract/`rustyocr`. Captura de pantalla del sistema + OCR nativo.

---

## Priorización sugerida (subject a confirmar)

**Para empezar ahora (extiende feature existente, backend UI-first):**
1. Saved HTTP collections — extiende `http-tester`, fácil gancho con Appwrite.
2. Webhook inspector — diferenciador fuerte.
3. Team workspace — habilita monetización "Empresas".

**Para empezar ahora sin backend nuevo:**
1. IA-asistida en Regex Tester / cURL↔código / Mock Data Generator — infra ya existe.
2. Env / .env manager vía File System Access API.

---

_Última actualización: 2026-07-19._

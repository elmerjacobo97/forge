# Ideas de funcionalidades

> Lluvia de ideas para módulos futuros de Forge. No es roadmap ni spec, solo un registro de posibilidades a explorar. Filtrar y priorizar cuando se defina roadmap.

Forge es browser-only (ver `AGENTS.md`): nada de Tauri/Rust/native-IPC. Stack actual: Next.js 16 App Router + InsForge.

---

## Ya hecho (dejar de tratar como idea)

- **Auth + sesión** — `features/auth`, login/register/logout sobre InsForge; refresh en `src/proxy.ts`.
- **Cloud sync de bookmarks / resources** — viven en InsForge con RLS por usuario.
- **Dev Board** — kanban con time tracking, analítica y CLI (`forge-cli ticket ...`).
- **Uptime Monitor** — chequeos programados, latencia, historial y alertas Telegram/Slack.
- **Webhook Inspector** — URLs temporales con captura e inspección de requests.
- **CLI** (`forge-cli`) — CRUD de bookmarks, proyectos, tickets y recursos.
- **Generación asistida por IA** — `/api/ai-content` (Groq) integrada en bookmarks y resources.
- **Image Tools** — compresión y conversión local en el navegador.
- **HTTP Tester** — requests reales desde el servidor, sin CORS.

---

## IA, con infraestructura lista (`/api/ai-content`)

- **Regex Tester:** explicación del patrón en lenguaje natural.
- **cURL ↔ código:** generación asistida (fetch/axios/httpie), no solo parsing determinista.
- **Mock Data Generator:** describir el shape deseado en lenguaje natural → schema JSON.
- **Auto-resumen / auto-tag:** extender el autocompletado ya usado en bookmarks/resources.

---

## Con backend (UI-first, conectar después)

### MCP server sobre forge-cli / API InsForge

Mismo API que ya consume `forge-cli`, expuesto como MCP stdio. Permite que agentes de IA operen bookmarks/proyectos/tickets/recursos directamente.

### Saved HTTP requests collections

Extender `http-tester`: colecciones tipo Postman con folders, environments (dev/staging/prod) y variables. Persistencia en InsForge.

### Env / .env manager

Editor con validación, masking de secrets y export a dotenv. Viable con File System Access API (Chrome/Edge) para leer/escribir el archivo con permiso explícito; degradar a copy/paste en Safari/Firefox.

### API key / secrets vault

Almacenamiento cifrado en backend, listado/rotación/copia con TTL.

### Feature flags dashboard

Toggles por entorno sobre una tabla InsForge.

### DB browser remoto

Conectar a una DB vía proxy del backend. Tablas, queries, resultados.

### Logs / observability viewer

Tail de logs estructurado con filtros por nivel.

---

## Descartado (requiere desktop, viola la regla browser-only)

- Clipboard manager nativo.
- Global hotkey + system tray.
- Port scanner local.
- OCR de capturas del sistema.

---

## Priorización sugerida (sujeta a confirmar)

**Sin backend nuevo:**

1. IA-asistida en Regex Tester, cURL↔código y Mock Data Generator.
2. Resize/crop en Image Tools.

**Con backend (extiende lo existente):**

1. MCP server sobre `forge-cli`.
2. Saved HTTP collections.
3. Env / `.env` manager.

---

_Última actualización: 2026-09-10._

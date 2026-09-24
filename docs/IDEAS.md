# Ideas de funcionalidades

> Lluvia de ideas para módulos futuros de Forge. No es roadmap ni spec, solo un registro de posibilidades a explorar. Filtrar y priorizar cuando se defina roadmap.

Forge es browser-only (ver `AGENTS.md`): nada de Tauri/Rust/native-IPC. Stack actual: Next.js 16 App Router + InsForge.

---

## Ya hecho (dejar de tratar como idea)

- **Auth + sesión** — `features/auth`, login/logout sobre InsForge (registro deshabilitado: herramienta personal); refresh en `src/proxy.ts`.
- **Resources** — enlaces viven en InsForge con RLS por usuario; web y CLI comparten filas.
- **Dev Board** — kanban con time tracking, analítica y CLI (`forge-cli ticket ...`).
- **Ideas** — captura de ideas con estado, categoría, tags y enlaces (web + CLI).
- **Uptime Monitor** — chequeos programados, latencia, historial y alertas Telegram/Slack.
- **Webhook Inspector** — URLs temporales con captura e inspección de requests.
- **CLI** (`forge-cli`) — CRUD de recursos, ideas, proyectos y tickets; `bookmark` es alias de `resource`.

---

## Ideas futuras fuera de alcance actual

- **Regex Tester:** explicación del patrón en lenguaje natural.
- **cURL ↔ código:** generación asistida (fetch/axios/httpie), no solo parsing determinista.
- **Mock Data Generator:** describir el shape deseado en lenguaje natural → schema JSON.
- **Auto-resumen / auto-tag:** evaluar generación para Resources si vuelve a ser necesaria.

---

## Con backend (UI-first, conectar después)

### MCP: escritura en Dev Board

El MCP remoto actual expone consultas de Dev Board. Evaluar mutaciones después si hacen falta.

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

_Última actualización: 2026-09-13._

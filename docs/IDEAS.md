# Ideas de funcionalidades

> Lluvia de ideas para módulos futuros de Forge. No es roadmap ni spec, solo un registr de posibilidades a explorar. Filtrar y priorizar cuando se defina roadmap.

Organizadas por dependencia de backend:

---

## Tauri-native (sin backend, solo OS)

### Clipboard manager
- Historial local usando `tauri-plugin-clipboard`.
- Sin nube, encaja con el principio privacy-first.
- Búsqueda, favoritos, snippets guardados.

### Global hotkey + system tray
- `tauri-plugin-global-shortcut` abre Forge desde cualquier app (dev launcher).
- `tauri-plugin-tray` mantiene Forge en background.
- Combo: hotkey abre, tray minimiza. Como Raycast/Alfred lite.

### File hasher con drag-drop y streaming
- Extender `hash_file` existente con soporte drop múltiple.
- Streaming en Rust para archivos grandes (mucho más rápido que client-side).

### Image tools
- Comprimir / convertir PNG / JPG / WebP sin subir a web.
- Rust `image` crate. Local, rápido, privado.

### Local dev-server monitor
- Dashboard de "está vivo localhost:3000/8080/etc." con pings.
- Aprovecha `tauri-plugin-http` (ya en allowlist).

### Port scanner local
- Rust std::net para revisar puertos ocupados antes de levantar servicios.

### SQLite snippet manager
- `tauri-plugin-sql`. Snippets / commands reusables local.
- Semi-backend, prepara terreno para sync remoto.

### OCR screenshot
- `tauri-plugin-screencapture` + Tesseract / `rustyocr`.
- Captura pantalla -> texto extraído. Útil para devs.

### Env / .env manager
- Editor con validación, secrets masking, export a dotenv.
- Solo escritura al FS local.

---

## Con backend (UI-first, conectar después)

### Auth + session
- Pantalla login / register, refresh tokens, multi-workspace switcher.
- Base necesaria para todo lo demás.

### Cloud sync de snippets / history
- Clipboard manager + historial guardado al backend.
- Multi-device sync. Salir del puramente local.

### API key / secrets vault
- Store encrypted en backend.
- Forge UI lista, rota, copia con TTL.
- Mejor que .env suelto.

### Team workspace
- Snippets compartidos, templates, permisos. Invite flow.
- El "backend" justifica el account.

### Saved HTTP requests collections
- Extender `http-tester` existente.
- Backend persiste collections tipo Postman: folders, envs (dev/staging/prod), variables.
- Valor alto porque ya hay feature base.

### Webhook inspector
- Tipo webhook.site. Backend genera URL única, recibe requests.
- Forge muestra en realtime (Tauri WebSocket / SSE).
- Killer feature para devs. Diferenciador.

### Cron / scheduled jobs viewer
- Backend corre jobs. Forge dashboard con logs, next-run, retry.
- UI lista para cuando exista el scheduler.

### Feature flags dashboard
- Toggle flags por env / user.
- Conecta a backend config. UI liviana, mucho valor.

### DB browser remoto
- Conectar a DB via backend proxy.
- Tablas, queries, results. Tipo TablePlus lite.

### Logs / observability viewer
- Backend stream logs. Forge tail en vivo con filter / level.
- Tipo console.log pero estructurado.

---

## Priorización sugerida (subject a confirmar)

**Para empezar ahora sin backend:**
1. Clipboard manager
2. Global hotkey + system tray
Procuren mucho "feeling desktop" con poco código.

**Para empezar UI ahora, backend después:**
1. Auth + session — todo depende de esto.
2. Saved HTTP collections — extiende feature existente, fácil gancho con backend.
3. Webhook inspector — diferenciador fuerte.

---

_Última actualización: Jun 2026._
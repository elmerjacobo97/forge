# SPEC 09 — Uptime Monitor

> **Estado:** Implementado
> **Depende de:** Ninguna (reutiliza patrón de admin client de SPEC 07)
> **Fecha:** 2026-07-21
> **Objetivo:** Permitir a usuarios autenticados monitorear URLs propias con checks HTTP periódicos ejecutados por un schedule de InsForge y recibir alertas de caída/recuperación por Telegram.

## Alcance

**Incluye:**

- Feature `apps/web/src/features/uptime-monitor/` + ruta autenticada `/uptime-monitor` + entrada en `tools.ts` (categoría Network).
- Tablas InsForge: `uptime_monitors`, `uptime_checks`, `uptime_notification_settings` (migración + RLS).
- CRUD de monitores solo para el dueño autenticado: crear, listar, editar, pausar/reanudar (toggle `enabled`), borrar (hard delete + cascade de checks).
- Monitor: nombre, URL (http/https), método GET o HEAD, status esperado (default 200), timeout 10 s, intervalo (1/5/15/30 min), umbral de fallos consecutivos (default 2), `enabled`.
- Límite: máx 10 monitores por usuario (validado en servidor).
- Schedule InsForge (pg_cron) cada minuto → `POST /api/uptime/run` con `Authorization: Bearer CRON_TOKEN`. Handler idempotente: selecciona monitores habilitados cuyo intervalo toca, ejecuta checks en paralelo (`fetch` con timeout), guarda resultado.
- Estado del monitor: `up`/`down`/`pending`; transición a `down` tras N fallos consecutivos, a `up` con un check exitoso.
- Alertas Telegram: mensaje de caída al alcanzar N fallos consecutivos y mensaje de recuperación al volver a `up`. Una sola alerta por transición (sin spam por cada check fallido).
- Settings de notificación globales por usuario: bot token de Telegram (bot propio vía @BotFather) + chat ID, con botón "enviar mensaje de prueba".
- Retención: checks > 30 días se borran en el mismo run del cron.
- UI: lista de monitores (estado, latencia último check, uptime % 24 h), detalle con historial de checks e incidentes recientes (transiciones down/up).
- Escrituras del cron handler con admin client (`INSFORGE_API_KEY`), mismo patrón que webhook-inspector.

**Fuera de alcance (specs futuras):**

- Correo, Slack y Discord como canales (pedidos originalmente; cada uno en su spec).
- Destinos de notificación por monitor (v1 es global por usuario).
- Validación de keyword en body, umbral de latencia, checks TCP/ping/DNS.
- Gráficas de latencia.
- Página de status pública / compartir.
- Regiones múltiples de check.
- Escalado, reintentos de alerta, silencios programados (maintenance windows).
- CLI / MCP.

## Modelo de datos

Migración nueva en `migrations/` (snake_case + RLS, mismo estilo). Tipos de app en `features/uptime-monitor/types/`.

```ts
// Postgres → camelCase en la app

type MonitorMethod = "GET" | "HEAD";
type MonitorStatus = "pending" | "up" | "down";
type MonitorInterval = 1 | 5 | 15 | 30; // minutos

type UptimeMonitor = {
  id: string; // uuid
  userId: string;
  name: string; // 1–80 chars
  url: string; // http/https válida
  method: MonitorMethod; // default "GET"
  expectedStatus: number; // default 200
  intervalMinutes: MonitorInterval; // default 5
  failureThreshold: number; // 1–10, default 2
  enabled: boolean; // default true
  status: MonitorStatus; // default "pending"
  consecutiveFailures: number; // default 0
  lastCheckedAt: string | null;
  createdAt: string;
};

type UptimeCheck = {
  id: string;
  monitorId: string;
  ok: boolean;
  statusCode: number | null; // null si error de red/timeout
  latencyMs: number;
  error: string | null; // "timeout", "dns", mensaje corto
  checkedAt: string;
};

// Incidente = periodo down; lo abre/cierra el cron en transiciones
type UptimeIncident = {
  id: string;
  monitorId: string;
  startedAt: string;
  endedAt: string | null; // null = sigue caído
};

type UptimeNotificationSettings = {
  userId: string; // PK
  telegramBotToken: string | null;
  telegramChatId: string | null;
  updatedAt: string;
};
```

**SQL (forma):**

- `uptime_monitors`: `user_id` → `auth.users(id) ON DELETE CASCADE`; índices `(user_id)`, `(enabled)`.
- `uptime_checks`: `monitor_id` → `uptime_monitors(id) ON DELETE CASCADE`; índice `(monitor_id, checked_at DESC)`.
- `uptime_incidents`: `monitor_id` → cascade; índice `(monitor_id, started_at DESC)`.
- `uptime_notification_settings`: PK `user_id` → cascade.

**RLS:**

- Todas: `authenticated` con `user_id = auth.uid()` (checks/incidents vía join al monitor del dueño).
- Monitores/settings: `SELECT/INSERT/UPDATE/DELETE`. Checks/incidents: solo `SELECT` para el usuario (los escribe el cron con admin client).

**Env:**

- `CRON_TOKEN` — server-only; también secret en InsForge para el header del schedule.
- `INSFORGE_API_KEY` — ya existe (SPEC 07); admin client del cron handler.

**Reglas de negocio en servidor:**

- Máx 10 monitores por `user_id` al crear.
- Monitor toca check si `enabled` y (`last_checked_at IS NULL` o `now() - last_checked_at >= interval`).
- Fallo = status ≠ esperado, timeout (10 s) o error de red. `consecutive_failures++`; al llegar exacto a `failure_threshold`: status → `down`, abrir incidente, alerta Telegram de caída (una vez).
- Éxito: si estaba `down` → cerrar incidente + alerta de recuperación; `consecutive_failures = 0`, status → `up`.
- Sin settings de Telegram configurados: transiciones se registran igual, solo no se envía mensaje.
- Cleanup en el mismo run: `DELETE uptime_checks WHERE checked_at < now() - 30 días`.

**Nota:** bot token de Telegram se guarda en texto plano en Postgres, protegido por RLS. Cifrado queda fuera de v1 (ver riesgos).

## Plan de implementación

1. Migración SQL: `uptime_monitors`, `uptime_checks`, `uptime_incidents`, `uptime_notification_settings` + índices + RLS + FK cascade. Aplicar con InsForge CLI.
2. Documentar `CRON_TOKEN` en `apps/web/.env.local.example`. Reutilizar helper de admin client de SPEC 07 (moverlo a ubicación compartida si hace falta).
3. Tipos + schemas Zod + constantes (intervalos 1/5/15/30, timeout 10 s, máx 10 monitores, threshold 1–10, retención 30 d) en `features/uptime-monitor/`.
4. Servicio autenticado (SSR client): `listMonitors`, `createMonitor`, `updateMonitor`, `deleteMonitor`, `listChecks(monitorId)`, `listIncidents(monitorId)`, `getNotificationSettings`, `saveNotificationSettings`. Tests de validación/límites sin InsForge real.
5. Server Actions para create/update/delete/toggle + settings, con re-check de auth y tope de 10; toasts.
6. Módulo `features/uptime-monitor/server/telegram.ts`: `sendTelegramMessage(botToken, chatId, text)` vía `api.telegram.org/bot<token>/sendMessage`. Server Action "mensaje de prueba". Tests con fetch mockeado.
7. Módulo `features/uptime-monitor/server/run-checks.ts`: lógica pura del run — seleccionar monitores que tocan, ejecutar `fetch` con `AbortSignal.timeout(10_000)` en paralelo, evaluar resultado, actualizar estado/incidentes, disparar alertas, cleanup 30 d. Tests de transiciones (up→down en threshold, down→up, sin spam de alertas).
8. Route Handler `app/api/uptime/run/route.ts` (POST): validar `Authorization: Bearer CRON_TOKEN`, invocar `run-checks` con admin client, responder resumen `{ checked: n }`. `401` sin token válido.
9. Crear schedule en InsForge: `schedules.create_job` cada minuto (`* * * * *`) hacia `{APP_URL}/api/uptime/run` con header del secret `CRON_TOKEN`. Documentar el SQL en la migración o en README del feature.
10. UI `/uptime-monitor`: lista de monitores (estado, latencia último check, uptime % 24 h, toggle pausa), dialogs crear/editar, borrar con confirmación, settings de Telegram con botón de prueba.
11. UI detalle: historial de checks (status, latencia, error, hora) + incidentes recientes; polling 30 s con pestaña visible.
12. Registrar tool en `tools.ts` (Network) + página thin en `(authenticated)`.
13. `pnpm --filter @forge/web exec vitest run` en tests nuevos + `pnpm build` + `pnpm lint` + smoke manual: crear monitor a URL propia, forzar caída (URL inexistente), verificar alerta y recuperación en Telegram.

## Criterios de aceptación

- [ ] Usuario autenticado puede crear un monitor con nombre, URL, método, status esperado, intervalo y threshold; aparece en la lista con estado `pending`.
- [ ] No se puede crear un 11.º monitor; la UI muestra error claro.
- [ ] URL inválida (no http/https) se rechaza en formulario y servidor.
- [ ] `POST /api/uptime/run` sin `CRON_TOKEN` válido responde `401` y no ejecuta nada.
- [ ] Con token válido, el run solo chequea monitores `enabled` cuyo intervalo toca; responde `{ checked: n }`.
- [ ] Check exitoso guarda fila en `uptime_checks` con `ok: true`, `statusCode` y `latencyMs`; monitor pasa a `up`.
- [ ] Check fallido (status inesperado, timeout o error de red) guarda `ok: false` con `error` descriptivo.
- [ ] Monitor con threshold 2 pasa a `down` en el 2.º fallo consecutivo, no en el 1.º; se crea incidente con `endedAt: null`.
- [ ] Al pasar a `down` llega exactamente un mensaje de Telegram de caída; checks fallidos posteriores no reenvían.
- [ ] Al volver un check exitoso: incidente se cierra, monitor pasa a `up`, llega un mensaje de recuperación.
- [ ] Sin settings de Telegram, las transiciones se registran igual y no hay error en el run.
- [ ] Botón "mensaje de prueba" envía Telegram con los datos guardados y reporta éxito/fallo en la UI.
- [ ] Monitor pausado no se chequea; al reanudar vuelve a chequearse.
- [ ] Borrar monitor elimina sus checks e incidentes (cascade).
- [ ] Checks con más de 30 días se borran en el run del cron.
- [ ] Lista muestra estado, latencia del último check y uptime % de 24 h; detalle muestra historial e incidentes con polling 30 s.
- [ ] Usuario B no ve ni modifica monitores, checks, incidentes ni settings de usuario A (RLS).
- [ ] `CRON_TOKEN` e `INSFORGE_API_KEY` no aparecen en bundle cliente.
- [ ] Tool visible en navegación vía `tools.ts` en `/uptime-monitor`.
- [ ] Tests unitarios nuevos pasan con Vitest; `pnpm build` y `pnpm lint` terminan bien.

## Decisiones

- **Sí:** Schedule InsForge (pg_cron) cada minuto hacia Route Handler de Next con `CRON_TOKEN`. Sin infra externa; lógica en un solo deploy. Descartados Vercel Cron y cron externo.
- **Sí:** Check v1 = GET/HEAD + status esperado + timeout 10 s. Cubre la mayoría de casos; keyword/latencia descartados para v1.
- **Sí:** Intervalo por monitor con opciones cerradas 1/5/15/30 min; el cron corre cada minuto y filtra.
- **Sí:** Telegram como único canal v1. Correo/Slack/Discord descartados: cada uno en su propia spec (correo además requiere proveedor).
- **Sí:** Bot propio del usuario (@BotFather) con token + chat ID en settings. Descartado bot compartido de Forge: requiere flujo /start y webhook propio.
- **Sí:** Destino Telegram global por usuario. Por-monitor descartado para v1 (formulario más largo, poco valor inicial).
- **Sí:** Alerta tras N fallos consecutivos (default 2) + mensaje de recuperación; una alerta por transición. Descartada alerta al primer fallo (falsos positivos por blips).
- **Sí:** Toggle pausar/reanudar (`enabled`).
- **Sí:** Máx 10 monitores/usuario; retención de checks 30 días con cleanup en el propio run.
- **Sí:** Tabla `uptime_incidents` explícita, abierta/cerrada por el cron. Derivar incidentes de los checks descartado: frágil y caro de consultar.
- **Sí:** Estado del monitor (`status`, `consecutive_failures`) denormalizado en `uptime_monitors`. Evita recalcular en cada render y cada run.
- **Sí:** Escrituras del cron con admin client (`INSFORGE_API_KEY`), patrón de SPEC 07; usuarios solo leen checks/incidents vía RLS.
- **Sí:** Bot token en texto plano en Postgres protegido por RLS. Cifrado app-level descartado en v1 (complejidad sin amenaza clara mientras la DB no sea compartida).
- **No:** Correo, Slack, Discord, destinos por monitor, keyword/latencia, TCP/ping/DNS, gráficas, status page pública, multi-región, maintenance windows, CLI/MCP. Cada uno en su spec si entra.

## Riesgos

| Riesgo                                                                    | Mitigación                                                                                                                                                      |
| ------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Run del cron excede timeout serverless con muchos monitores               | Checks en paralelo (`Promise.allSettled`), timeout 10 s por check, máx 10 monitores/usuario; si crece, sharding por run en spec futura                          |
| pg_cron no reintenta runs fallidos → checks perdidos                      | Handler idempotente basado en `last_checked_at`; el siguiente tick (1 min) recupera; un tick perdido solo retrasa un check                                      |
| Doble ejecución del run (tick solapado o retry manual) → alerta duplicada | Transición a `down` solo cuando `consecutive_failures` alcanza el threshold exacto y estado previo ≠ `down`; incidente abierto se comprueba antes de crear otro |
| Bot token de Telegram filtrado                                            | Texto plano solo tras RLS; nunca en bundle cliente; envío solo server-side; cifrado app-level si esto pasa a multi-tenant serio                                 |
| `api.telegram.org` caído o token inválido → alerta perdida                | Error de envío se loguea y no rompe el run; botón de prueba en settings para validar config; reintentos quedan fuera de v1                                      |
| Tabla `uptime_checks` crece rápido (1 min × monitores)                    | Retención 30 d con cleanup en el run; índice `(monitor_id, checked_at DESC)`                                                                                    |
| SSRF: usuario apunta monitor a IPs internas/metadata                      | Validar URL http/https y rechazar hosts privados (localhost, 127.x, 10.x, 172.16–31.x, 192.168.x, 169.254.x) en servidor                                        |
| `CRON_TOKEN` filtrado → cualquiera dispara runs                           | Server-only + secret InsForge; el run es idempotente y solo chequea lo que toca, daño limitado; rotar token si se filtra                                        |

## Qué **no** está en esta spec

- Correo, Slack y Discord como canales de notificación.
- Destinos de notificación por monitor.
- Keyword en body, umbral de latencia, checks TCP/ping/DNS.
- Gráficas de latencia, status page pública, multi-región.
- Reintentos de alerta, escalado, maintenance windows.
- CLI / MCP.

Cada uno de esos, si entra, va en su propia spec.

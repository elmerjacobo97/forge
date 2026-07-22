# SPEC 07 — Webhook Inspector

> **Status:** Implemented
> **Depends on:** Ninguna
> **Date:** 2026-07-20
> **Objective:** Permitir a usuarios autenticados crear URLs públicas temporales que capturan requests HTTP entrantes y las muestran en Forge con polling.

## Alcance

**Incluye:**

- Feature `apps/web/src/features/webhook-inspector/` + ruta autenticada `/webhook-inspector` + entrada en `tools.ts` (categoría Network).
- Tablas InsForge: `webhook_endpoints`, `webhook_events`, `webhook_rate_limits` (migración + RLS).
- CRUD de endpoints solo para el dueño autenticado: crear (nombre opcional), listar, copiar URL, borrar (hard delete + cascade de eventos).
- Límites: máx 5 endpoints activos/usuario; TTL 7 días; al expirar el receptor público responde 404 y no guarda.
- Receptor público en `apps/web/src/app/api/hooks/[token]/route.ts`: acepta cualquier método; responde siempre `200` con `{"ok":true}` si el token es válido y no expiró (salvo rate limit → `429`).
- Persistencia de cada evento: método, path+query, headers JSON, body texto truncado a 64 KB + flag `body_truncated`, IP/user-agent si vienen, `received_at`.
- Tope 100 eventos/endpoint: al superar, **rechazar** nuevos requests (no rotar/borrar el más viejo en silencio) con `507` o `429` y mensaje claro.
- Rate limit 60 req/min por token vía `webhook_rate_limits` (escrituras con service role / admin client).
- UI: lista de endpoints, feed de eventos con polling cada 2 s si la pestaña está visible, detalle (headers + body), copiar request como cURL.
- Escrituras del receptor con `createAdminClient({ apiKey: process.env.INSFORGE_API_KEY })` (nunca expuesto al browser).

**Fuera de alcance (specs futuras):**

- InsForge Realtime.
- Respuesta custom (status/body configurables).
- Reenviar evento a otra URL.
- Binary / multipart completo (solo texto/truncado).
- Subdominio dedicado `hooks.*`.
- CLI / MCP.
- Uso anónimo.
- Planes Free/Pro / billing.
- Job automático de cleanup de endpoints expirados (el receptor ya los ignora; cleanup batch queda para otra spec).

## Modelo de datos

Migración nueva en `migrations/` (mismo estilo snake_case + RLS que el schema inicial). Tipos de app en `features/webhook-inspector/types/`.

```ts
// Postgres → camelCase en la app (igual que bookmarks / Dev Board)

type WebhookEndpoint = {
  id: string; // uuid
  userId: string;
  token: string; // opaco, alta entropía (ej. 32 bytes hex/base64url); UNIQUE
  name: string; // "" o 1–80 chars
  expiresAt: string; // created_at + 7 días
  createdAt: string;
};

type WebhookEvent = {
  id: string;
  endpointId: string;
  method: string; // GET, POST, …
  path: string; // path + query capturados
  headers: Record<string, string>; // JSONB
  body: string; // texto; truncado a 64_000 chars
  bodyTruncated: boolean;
  sourceIp: string | null;
  userAgent: string | null;
  receivedAt: string;
};

// Rate limit: una fila por token + ventana de 1 minuto
type WebhookRateLimit = {
  token: string; // parte de UNIQUE con window_start
  windowStart: string; // truncado a minuto UTC
  requestCount: number;
};
```

**SQL (forma):**

- `webhook_endpoints`: `user_id` → `auth.users(id) ON DELETE CASCADE`; `token UNIQUE`; índices `(user_id)`, `(token)`, `(expires_at)`.
- `webhook_events`: `endpoint_id` → `webhook_endpoints(id) ON DELETE CASCADE`; índice `(endpoint_id, received_at DESC)`.
- `webhook_rate_limits`: clave `(token, window_start)`; sin RLS de usuario (solo admin client del Route Handler).

**RLS:**

- `webhook_endpoints` / `webhook_events`: `authenticated` solo `SELECT/INSERT/DELETE` donde `user_id = auth.uid()` (events vía join al endpoint del dueño).
- Sin políticas `anon` de escritura: el receptor usa `createAdminClient({ apiKey: process.env.INSFORGE_API_KEY })`.

**Env (server-only / público según corresponda):**

- `INSFORGE_API_KEY` — admin client del Route Handler (server-only).
- `NEXT_PUBLIC_APP_URL` — origen para armar la URL copiable (`{APP_URL}/api/hooks/{token}`).

**Reglas de negocio en servidor (no solo CHECK):**

- Máx 5 endpoints no expirados por `user_id` al crear.
- Si `now() >= expires_at` → receptor responde `404`, no inserta.
- Si `count(events) >= 100` → receptor responde `507` (o `429`), no inserta.
- Rate limit: si `request_count > 60` en la ventana → `429`.

## Plan de implementación

1. Añadir migración SQL: tablas `webhook_endpoints`, `webhook_events`, `webhook_rate_limits` + índices + RLS + FK cascade. Aplicar con InsForge CLI.
2. Documentar `INSFORGE_API_KEY` y `NEXT_PUBLIC_APP_URL` en `apps/web/.env.local.example`. Helper server-only `createAdminClient` en `features/webhook-inspector/server/` (o `lib/insforge/` si ya encaja).
3. Tipos + schemas Zod + constantes (TTL 7d, máx 5 endpoints, 64 KB, 100 eventos, 60 rpm) en `features/webhook-inspector/`.
4. Servicio autenticado (SSR client): `listEndpoints`, `createEndpoint`, `deleteEndpoint`, `listEvents(endpointId)`. Tests unitarios de validación/límites sin InsForge real.
5. Server Actions (o mutations) para create/delete con re-check de auth + tope de 5; toasts de error/éxito.
6. Route Handler público `app/api/hooks/[token]/route.ts`: rate limit → lookup token → expiry/count → leer body truncado → insert event → `200 {"ok":true}`. Cubrir métodos HTTP relevantes (`GET/POST/PUT/PATCH/DELETE/HEAD/OPTIONS` según lo práctico en Next).
7. Tests del receptor: token inválido/expirado, truncado, rate limit, cupo de eventos (handlers puros / mocks).
8. UI `/webhook-inspector`: lista de endpoints (nombre, URL, expires, copiar, borrar), crear endpoint.
9. UI detalle: feed de eventos + panel headers/body + copiar cURL; polling 2 s si `document.visibilityState === "visible"`.
10. Registrar tool en `tools.ts` (Network) + página thin en `(authenticated)`.
11. `pnpm --filter @forge/web exec vitest run` en tests nuevos + smoke manual del receptor con `curl`.

Cada paso deja la app usable; el receptor solo “vive” a partir del paso 6.

## Criterios de aceptación

- [ ] Usuario autenticado puede crear un endpoint con nombre opcional y ver una URL `…/api/hooks/<token>`.
- [ ] No se puede crear un 6.º endpoint activo (no expirado); la UI muestra error claro.
- [ ] Copiar URL pone en el portapapeles la URL pública completa.
- [ ] Borrar un endpoint elimina también sus eventos (cascade).
- [ ] `curl -X POST <url> -H 'Content-Type: application/json' -d '{"a":1}'` recibe `200` y body `{"ok":true}`.
- [ ] Ese POST aparece en el feed (método, path, hora) sin recargar manualmente en ≤ ~2 s con la pestaña visible.
- [ ] El detalle muestra headers y body; si el body supera 64 KB, está truncado y `bodyTruncated` es true en datos/UI.
- [ ] Token inexistente o expirado → `404` y no se crea evento.
- [ ] Más de 60 requests/min al mismo token → `429`.
- [ ] Endpoint con 100 eventos → nuevos requests no se guardan y responden error de cupo (`507` o `429` según lo fijado en implementación).
- [ ] “Copiar como cURL” genera un comando usable con method/headers/body del evento.
- [ ] Usuario B no ve ni borra endpoints/eventos de usuario A (RLS).
- [ ] `INSFORGE_API_KEY` no aparece en bundle cliente ni en `NEXT_PUBLIC_*`.
- [ ] Tool visible en navegación vía `tools.ts` en `/webhook-inspector`.
- [ ] Tests unitarios nuevos del feature pasan con Vitest.

## Decisiones

- **Sí:** Receptor en Route Handler Next (`/api/hooks/[token]`). Un solo deploy; sin edge function nueva en v1.
- **Sí:** Solo usuarios autenticados crean/gestionan endpoints.
- **Sí:** Varios endpoints (máx 5), TTL 7 días, nombre opcional.
- **Sí:** Hard delete + cascade de eventos. Menos basura y menos riesgo de datos viejos.
- **Sí:** Polling 2 s con pestaña visible. Realtime queda para otra spec.
- **Sí:** Admin client (`INSFORGE_API_KEY` + `createAdminClient`) para writes del receptor. Sin INSERT anónimo por RLS.
- **Sí:** Rate limit en tabla Postgres (multi-instancia / serverless).
- **Sí:** Cupo 100 eventos: **rechazar** nuevos (no rotar/borrar el más viejo en silencio).
- **Sí:** Respuesta fija `200 {"ok":true}` cuando se acepta el evento.
- **Sí:** URL pública `{NEXT_PUBLIC_APP_URL}/api/hooks/{token}`.
- **No:** Edge Function InsForge como receptor en esta spec.
- **No:** Uso anónimo tipo webhook.site.
- **No:** Respuesta custom, reenviar, binary/multipart completo.
- **No:** Subdominio `hooks.*`, CLI, MCP, billing Free/Pro.
- **No:** Job de cleanup de expirados (el receptor ya responde 404; cleanup batch después).

## Riesgos

| Riesgo                                           | Mitigación                                                                                         |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| Abuso del endpoint público (spam / DoS ligero)   | Rate limit 60/min en Postgres; body 64 KB; tope 100 eventos; TTL 7d; máx 5 endpoints/usuario       |
| `INSFORGE_API_KEY` filtrada al cliente           | Solo en Route Handler / server helpers; nunca `NEXT_PUBLIC_*`; review de imports                   |
| Cold start / latencia del receptor en serverless | Respuesta mínima tras insert; sin trabajo extra; índices en `token` y `(endpoint_id, received_at)` |
| Polling genera carga con muchos usuarios mirando | Intervalo 2 s solo con pestaña visible; Realtime en spec futura si hace falta                      |
| Endpoints expirados acumulan filas               | Receptor ya da 404; cleanup batch fuera de alcance (otra spec)                                     |
| Emisores que reintentan ante no-2xx              | En éxito siempre `200 {"ok":true}`; cupo/rate limit usan 429/507 a propósito                       |

## Qué **no** está en esta spec

- InsForge Realtime.
- Respuesta custom, reenviar evento, binary/multipart completo.
- Subdominio `hooks.*`, CLI, MCP, uso anónimo, billing.
- Job automático de cleanup de endpoints/eventos expirados.

Cada uno de esos, si entra, va en su propia spec.

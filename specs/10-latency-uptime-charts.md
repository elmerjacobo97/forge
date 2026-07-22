# SPEC 10 — Gráficas de latencia y uptime histórico

> **Estado:** Implemented
> **Depende de:** SPEC 09 (Uptime Monitor)
> **Fecha:** 2026-07-22
> **Objetivo:** Visualizar la latencia y disponibilidad histórica de cada monitor con gráfica de latencia por rango (24h/7d/30d), barras diarias de uptime de 30 días y sparklines en la lista, alimentadas por agregación SQL.

## Alcance

**Incluye:**

- RPC/vista Postgres de agregación por bucket sobre `uptime_checks`: `avg_latency_ms`, `ok_count`, `total_count` agrupados por intervalo de tiempo, filtrado por `monitor_id` y rango.
- Endpoint/servicio: `getLatencyBuckets(monitorId, range)` con `range` en `"24h" | "7d" | "30d"`; bucket 30 min / 3 h / 1 día respectivamente.
- Endpoint/servicio batcheado: `getSparklineBuckets(monitorIds[])` — buckets de 24h (30 min) para todos los monitores del usuario en una sola llamada.
- Endpoint/servicio: `getDailyUptime(monitorId)` — uptime % por día, últimos 30 días.
- Stats de uptime en detalle: 24h / 7d / 30d, calculadas junto con las mismas agregaciones (sin queries extra de checks crudos).
- UI detalle (`monitor-detail.tsx`): gráfica de línea (Recharts) de latencia promedio con selector de rango 24h/7d/30d; fila de barras diarias de uptime (30 días, 3 niveles de color + gris sin datos) con tooltip (% exacto + fecha).
- UI lista (`uptime-monitor.tsx` / `monitor-table-row.tsx`): sparkline de latencia 24h por fila, sin ejes, usando el batch.
- Loading/error states consistentes con el resto del feature (skeletons, `Alert` de error).
- Manejo de "sin datos": bucket vacío se omite o se marca gris; monitor nuevo sin checks muestra estado vacío coherente (sin gráfica rota).

**Fuera de alcance (specs futuras):**

- Exportar datos históricos (CSV).
- Comparar monitores entre sí en una misma gráfica.
- Rangos custom (fecha a fecha) — solo 24h/7d/30d fijos.
- Percentiles (p50/p95) — solo promedio en v1.
- Retención > 30 días / históricos de largo plazo (ligado a retención actual del cron de SPEC 09).
- Alertas basadas en umbral de latencia (ya fuera de alcance en SPEC 09).

## Modelo de datos

No se agregan tablas nuevas — todo se deriva de `uptime_checks` (SPEC 09) vía agregación SQL. Se agregan funciones RPC de Postgres (patrón ya usado en dev-board) y sus tipos de app correspondientes.

```ts
// Postgres → camelCase en la app

type LatencyRange = "24h" | "7d" | "30d";

type LatencyBucket = {
  bucketStart: string; // ISO, inicio del intervalo
  avgLatencyMs: number | null; // null si el bucket no tiene checks
  okCount: number;
  totalCount: number;
};

type DailyUptime = {
  date: string; // YYYY-MM-DD (UTC)
  uptimePercentage: number | null; // null = sin checks ese día (gris)
  okCount: number;
  totalCount: number;
};

type UptimeStatsSummary = {
  monitorId: string;
  uptime24h: number | null;
  uptime7d: number | null;
  uptime30d: number | null;
};

// Para sparklines batcheadas de la lista
type MonitorSparkline = {
  monitorId: string;
  buckets: LatencyBucket[]; // fijo: 24h en buckets de 30 min (48 puntos)
};
```

**SQL (forma):**

- Función `uptime_latency_buckets(p_monitor_id uuid, p_range text)` → `SETOF` fila `(bucket_start timestamptz, avg_latency_ms numeric, ok_count int, total_count int)`. Bucket via `date_bin` sobre `checked_at`, filtrado por `monitor_id = p_monitor_id AND user_id = auth.uid()` (join a `uptime_monitors` para RLS implícita, o `SECURITY INVOKER` respetando RLS existente de `uptime_checks`).
- Función `uptime_daily_uptime(p_monitor_id uuid)` → filas `(day date, ok_count int, total_count int)` agrupadas por día, últimos 30 días.
- Función `uptime_sparklines(p_monitor_ids uuid[])` → filas `(monitor_id uuid, bucket_start timestamptz, avg_latency_ms numeric, ok_count int, total_count int)`, buckets de 30 min, últimas 24h, para el batch de la lista.
- Todas `SECURITY INVOKER` (no `SECURITY DEFINER`): heredan RLS de `uptime_checks`/`uptime_monitors`, así un usuario solo puede pedir datos de sus propios monitores — el filtro `user_id = auth.uid()` ya existe en la política de SPEC 09.
- `uptimePercentage` / `avgLatencyMs` = `null` cuando `total_count = 0` en ese bucket/día (sin checks) — la UI lo distingue de 0%.

**Sin migraciones de tablas nuevas.** Solo migración SQL nueva para las 3 funciones (`migrations/`, mismo estilo que las anteriores).

## Plan de implementación

1. Migración SQL: funciones `uptime_latency_buckets`, `uptime_daily_uptime`, `uptime_sparklines` (`SECURITY INVOKER`, `date_bin` para buckets). Aplicar con InsForge CLI.
2. Tipos de app (`LatencyRange`, `LatencyBucket`, `DailyUptime`, `UptimeStatsSummary`, `MonitorSparkline`) en `features/uptime-monitor/types/`.
3. Servicio (`services/uptime-monitor-service.ts` o nuevo `services/stats-service.ts`): `getLatencyBuckets(monitorId, range)`, `getDailyUptime(monitorId)`, `getSparklines(monitorIds[])`, `getUptimeStats(monitorId)` — todos vía `.rpc()` del cliente SSR/browser existente. Tests de mapeo/parsing sin InsForge real.
4. Hooks React Query en `hooks/queries.ts`: `useLatencyBucketsQuery(monitorId, range)`, `useDailyUptimeQuery(monitorId)`, `useSparklinesQuery(monitorIds[])`, `useUptimeStatsQuery(monitorId)`. Mismo patrón de cache/staleTime que queries existentes.
5. Util `utils/chart-data.ts`: transformar buckets/días crudos a shape de Recharts (rellenar huecos con `null` para gaps sin datos, formatear timestamps por rango).
6. Componente `components/latency-chart.tsx`: `LineChart` de Recharts, selector de rango (24h/7d/30d) con tabs/buttons, eje X formateado según rango, tooltip con hora + latencia, loading skeleton, empty state si no hay checks.
7. Componente `components/uptime-bar-strip.tsx`: fila de 30 barras (una por día), color por 3 niveles (verde ≥99%, ámbar 95-99%, rojo <95%, gris sin datos), tooltip por barra con fecha + %.
8. Componente `components/monitor-sparkline.tsx`: mini `LineChart` sin ejes/tooltip pesado, tamaño fijo para fila de tabla.
9. Integrar en `monitor-detail.tsx`: agregar `latency-chart` + `uptime-bar-strip` + stats 24h/7d/30d en la cabecera del detalle, junto a la tabla de checks/incidentes existente.
10. Integrar en `monitor-table-row.tsx` / `uptime-monitor.tsx`: usar `useSparklinesQuery` una vez a nivel de lista, pasar buckets correspondientes a cada fila.
11. `pnpm --filter @forge/web exec vitest run` en tests nuevos + `pnpm build` + `pnpm lint` + smoke manual: monitor con historial de varios días, verificar gráfica, barras y sparklines; monitor nuevo sin checks, verificar estados vacíos sin errores.

## Criterios de aceptación

- [ ] Detalle de monitor con historial muestra gráfica de latencia con selector 24h/7d/30d; cambiar rango recarga la gráfica con buckets correctos (30min/3h/1d).
- [ ] Gráfica de latencia omite o marca como gap los buckets sin checks (no interpola como 0).
- [ ] Detalle muestra fila de barras de uptime de 30 días, un color por día: verde ≥99%, ámbar 95-99%, rojo <95%, gris sin datos.
- [ ] Hover/tap sobre una barra diaria muestra tooltip con fecha y % exacto.
- [ ] Detalle muestra stats de uptime 24h / 7d / 30d en cabecera, coherentes con los datos de `uptime_checks`.
- [ ] Lista de monitores muestra sparkline de latencia 24h por fila, cargado con una sola llamada batcheada (no una query por fila).
- [ ] Monitor sin ningún check muestra estado vacío en gráfica/barras/sparkline, sin error ni gráfica rota.
- [ ] Usuario B no puede obtener buckets/uptime/sparklines de monitores de usuario A (RPC respeta RLS existente).
- [ ] Loading state (skeleton) visible mientras cargan gráficas/barras/sparklines.
- [ ] Error de red al pedir agregaciones muestra `Alert` de error, no rompe el resto de la página.
- [ ] Tests unitarios nuevos (mapeo de servicio, transformación a shape de gráfica) pasan con Vitest; `pnpm build` y `pnpm lint` terminan bien.

## Decisiones

- **Sí:** Agregación via funciones RPC de Postgres (`date_bin`) en vez de traer checks crudos al cliente. 30 días × 1 min ≈ 43k filas/monitor — inviable en cliente; RPC devuelve decenas de filas.
- **Sí:** `SECURITY INVOKER` en las 3 funciones, heredando RLS existente de `uptime_checks`/`uptime_monitors`. Evita duplicar lógica de autorización en `SECURITY DEFINER`.
- **Sí:** Buckets fijos por rango — 24h→30min, 7d→3h, 30d→1d. Balance densidad visual / costo de query; sin rango custom en v1.
- **Sí:** Solo promedio de latencia por bucket (no p50/p95/max). Con checks de 1 min el valor marginal de percentiles es bajo; `avg` es más barato y suficiente para ver tendencia/picos gruesos.
- **Sí:** Barras diarias con 3 niveles de color (verde/ámbar/rojo) + gris para sin datos. Más matiz que binario "hubo incidente sí/no", estilo statuspage clásico.
- **Sí:** Sparklines de lista con una sola RPC batcheada (`uptime_sparklines(monitor_ids[])`). Evita N llamadas con hasta 10 monitores.
- **Sí:** Recharts para todos los gráficos — ya es dependencia del proyecto (`package.json`), sin librería nueva.
- **Sí:** Bucket/día sin checks → `null`, distinto de 0%. La UI debe distinguir "sin datos" de "downtime total".
- **No:** Exportar CSV, comparar monitores en una gráfica, rangos custom por fecha, percentiles, retención >30d, alertas por umbral de latencia. Cada uno en su spec si entra.

## Riesgos

| Riesgo                                                                                        | Mitigación                                                                                                                                     |
| --------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| RPC de agregación lenta sin índice adecuado                                                   | `uptime_checks` ya tiene índice `(monitor_id, checked_at DESC)` (SPEC 09); `date_bin` + `GROUP BY` sobre ese índice es barato para 30d/monitor |
| `date_bin` con timezone mal alineado produce buckets desplazados vs. lo que el usuario espera | Bucketing en UTC consistente en las 3 funciones; formateo a hora local solo en la UI (cliente)                                                 |
| Sparkline batcheada crece si sube el límite de 10 monitores/usuario en el futuro              | Límite actual (SPEC 09) acota el batch; si el límite sube, revisar costo de `uptime_sparklines` en spec futura                                 |
| Gráfica de Recharts con monitor recién creado (0-1 checks) rompe visualmente (dominio vacío)  | Empty state explícito antes de renderizar `LineChart`/barras cuando `totalCount` global es 0                                                   |
| RPC filtra por `auth.uid()` pero se llama con parámetro `monitor_id` arbitrario               | `SECURITY INVOKER` + RLS existente en `uptime_checks` ya rechaza filas de otro usuario; función devuelve vacío, no error, para monitor ajeno   |

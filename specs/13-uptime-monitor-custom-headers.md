# SPEC 13 — Headers HTTP personalizados en Uptime Monitor

> **Estado:** Aprobado
> **Depende de:** SPEC 09 (Uptime Monitor)
> **Fecha:** 2026-07-23
> **Objetivo:** Permitir configurar headers HTTP personalizados por monitor, mantener sus valores ocultos en el cliente y enviarlos de forma segura en cada check programado.

## Alcance

**Incluye:**

- Añadir `request_headers JSONB NOT NULL DEFAULT '[]'::jsonb` a `uptime_monitors`; monitores existentes quedan con lista vacía.
- Configurar hasta 20 headers por monitor desde el diálogo de creación y edición mediante filas nombre/valor.
- Aplicar los headers guardados a cada check programado `GET` o `HEAD` de ese monitor.
- Exponer al cliente solo metadatos `{ name, configured: true }` de headers persistidos; sus valores permanecen server-side.
- Permitir conservar, reemplazar o borrar headers existentes; su nombre queda fijo y renombrar equivale a borrar y añadir.
- Exigir valores de 1–2000 caracteres, nombres de 1–100 caracteres y nombres únicos sin distinguir mayúsculas.
- Bloquear, sin distinguir mayúsculas, `host`, `content-length`, `connection`, `keep-alive`, `te`, `trailer`, `transfer-encoding`, `upgrade` y nombres con prefijo `proxy-`.
- Exigir URL HTTPS cuando el monitor tenga al menos un header custom.
- Para monitores con headers custom, seguir como máximo cinco redirects del mismo origen y reenviar los headers en cada salto.
- Registrar un redirect a otro origen como check fallido, conservando su status `3xx` y usando el error `Cross-origin redirect blocked`.
- Conservar estado, incidentes y contador de fallos cuando cambien los headers; el siguiente check programado refleja el cambio.
- Validar entradas tanto en formulario como en servidor y cubrir persistencia, ocultación, ejecución y redirects con pruebas automatizadas.

**Fuera de alcance (para specs futuras):**

- Headers globales por usuario o herencia global con overrides por monitor.
- Cifrado app-level de valores persistidos.
- Mostrar o revelar valores guardados en navegador.
- Una tabla relacionada por header.
- Toggle enabled/disabled por fila.
- Valores vacíos.
- Renombrado directo de headers existentes.
- Cambiar política de redirects para monitores sin headers custom.
- Nuevos métodos HTTP, request body, validación de contenido o checks TCP/ping/DNS.
- Incluir nombres o valores de headers en checks, incidentes, alertas o logs.
- Botón independiente para probar headers fuera del check programado.
- Soporte equivalente en CLI o una API pública de gestión.

## Modelo de datos

Se amplía `uptime_monitors`; no se crean tablas nuevas.

```ts
type PersistedRequestHeader = {
  name: string;
  value: string;
};

type RequestHeaderMetadata = {
  name: string;
  configured: true;
};

type RequestHeaderInput = {
  name: string;
  value: string | null;
  // string: crear o reemplazar.
  // null: conservar el valor persistido del mismo nombre durante una edición.
};

type UptimeMonitor = {
  // Campos existentes...
  requestHeaders: RequestHeaderMetadata[];
};

type CreateUptimeMonitorInput = {
  // Campos existentes...
  requestHeaders: RequestHeaderInput[];
};
```

**Cambio SQL en `uptime_monitors`:**

```sql
request_headers jsonb NOT NULL DEFAULT '[]'::jsonb
```

La migración añade constraints para exigir un array JSON y como máximo 20 elementos. Los monitores existentes reciben `[]`.

**Reglas:**

- La forma persistida es `PersistedRequestHeader[]`; el cron la valida como datos desconocidos antes de construir los headers de `fetch`.
- `UptimeMonitor` y las respuestas de create/update/list nunca incluyen `value`; solo devuelven `RequestHeaderMetadata[]`.
- En creación, cada `RequestHeaderInput.value` debe ser string no vacío.
- En edición, `value: null` conserva el valor existente cuyo nombre coincide sin distinguir mayúsculas.
- Omitir un header existente de `requestHeaders` lo borra.
- Enviar un string no vacío crea o reemplaza el valor.
- `value: null` sin header persistido coincidente se rechaza.
- El servidor compara nombres en minúsculas para detectar duplicados, aplicar denylist y resolver conservaciones; almacena el casing introducido.
- El nombre debe tener 1–100 caracteres y cumplir sintaxis de token HTTP.
- El valor debe tener 1–2000 caracteres y no puede contener `\r`, `\n` ni `\0`.
- Un array no vacío exige que `url` use `https:`.
- Los valores se guardan sin cifrado app-level, protegidos por RLS y acceso server-side de la aplicación.
- `MonitorRow` en `server/run-checks.ts` contiene `request_headers: PersistedRequestHeader[]`; estos valores no se copian a checks, incidentes, notificaciones ni logs.
- “Mismo origen” significa igualdad de esquema, hostname y puerto según `URL.origin`.

## Plan de implementación

1. Crear `migrations/20260723000000_add-uptime-monitor-request-headers.sql` para añadir `request_headers JSONB NOT NULL DEFAULT '[]'::jsonb`, constraint de array y límite de 20 elementos, sin cambiar RLS ni grants existentes. Aplicar la migración con InsForge CLI y comprobar que filas existentes contienen `[]`.
2. Añadir límites, denylist y máximo de redirects en `constants.ts`; extender `types/index.ts` y `schemas/uptime-monitor-schema.ts` con `PersistedRequestHeader`, `RequestHeaderMetadata`, `RequestHeaderInput`, validación de token HTTP, control de caracteres y requisito HTTPS. Crear `schemas/uptime-monitor-schema.test.ts` para verificar límites, duplicados case-insensitive, headers prohibidos, CR/LF/NUL, valores vacíos y HTTP con headers.
3. Extender `services/uptime-monitor-service.ts` para seleccionar y validar `request_headers`, mapearlos únicamente a metadatos públicos y resolver create/update con semántica conservar/reemplazar/borrar. Actualizar `services/uptime-monitor-service.test.ts` para demostrar persistencia, conservación por nombre case-insensitive, borrado, rechazo de `null` sin coincidencia y ausencia de valores en respuestas públicas.
4. Extender `server/run-checks.ts` para leer `request_headers` validados. Mantener el `fetch` actual para monitores sin headers; para monitores con headers, exigir HTTPS, usar `redirect: "manual"`, seguir hasta cinco respuestas `301`, `302`, `303`, `307` o `308` del mismo `URL.origin`, reenviar headers y bloquear cambios de origen. Actualizar `server/run-checks.test.ts` para cubrir envío en GET/HEAD, redirect relativo y absoluto same-origin, redirect cross-origin, exceso de redirects, valores ausentes y no inclusión de secretos en errores o notificaciones.
5. Crear `components/monitor-headers-editor.tsx` con filas clave/valor, máximo de 20, nombres fijos para entradas persistidas, campo vacío para conservar, reemplazo explícito y borrado por fila. Integrarlo en `components/monitor-form-dialog.tsx`, inicializar `requestHeaders: []` al crear y metadatos configurados al editar, mostrar errores inline y mantener el diálogo funcional en estados pending/error. Verificación manual del paso: crear y editar un monitor contra un endpoint HTTPS controlado que responda `200` solo con el header correcto, comprobar que el valor no reaparece en navegador y que el siguiente check queda `up`.

## Criterios de aceptación

- [ ] La migración añade `uptime_monitors.request_headers` como `JSONB NOT NULL DEFAULT '[]'::jsonb` con constraints de array y máximo 20 elementos.
- [ ] Todos los monitores existentes conservan sus datos y reciben `request_headers = []`.
- [ ] Usuario autenticado puede crear un monitor HTTPS con entre 1 y 20 headers nombre/valor.
- [ ] Usuario puede crear y editar un monitor sin headers; su comportamiento actual permanece igual.
- [ ] Cada check `GET` o `HEAD` envía exactamente los headers guardados para ese monitor.
- [ ] Un endpoint HTTPS que exige un header responde con el status esperado y deja el check en `ok: true` cuando el valor es correcto.
- [ ] Añadir headers a una URL `http:` se rechaza en formulario y servidor.
- [ ] Nombre vacío, valor vacío, más de 20 filas, nombre mayor de 100 caracteres o valor mayor de 2000 se rechazan.
- [ ] Nombres con sintaxis HTTP inválida y valores con `\r`, `\n` o `\0` se rechazan.
- [ ] Dos nombres iguales sin distinguir mayúsculas se rechazan.
- [ ] `host`, `content-length`, `connection`, `keep-alive`, `te`, `trailer`, `transfer-encoding`, `upgrade` y cualquier `proxy-*` se rechazan sin distinguir mayúsculas.
- [ ] `authorization`, `cookie`, `user-agent` y headers `x-*` válidos se aceptan.
- [ ] Al editar, cada header persistido muestra su nombre y estado configurado, pero nunca su valor.
- [ ] Dejar vacío el campo de reemplazo conserva el valor persistido.
- [ ] Introducir un valor nuevo reemplaza el valor persistido.
- [ ] Quitar una fila persistida borra ese header.
- [ ] Intentar conservar mediante `value: null` un nombre no persistido se rechaza.
- [ ] Respuestas de list/create/update y estado cliente contienen únicamente `{ name, configured: true }`; no contienen valores persistidos.
- [ ] Valores de headers no aparecen en `uptime_checks`, incidentes, alertas, logs ni mensajes de error.
- [ ] Editar headers no modifica status, incidentes, `consecutive_failures` ni `last_checked_at`.
- [ ] Para un monitor con headers, redirects `301`, `302`, `303`, `307` y `308` del mismo origen se siguen hasta un máximo de cinco y reciben los mismos headers.
- [ ] Un redirect cross-origin no ejecuta request al destino y guarda check fallido con status `3xx` y error `Cross-origin redirect blocked`.
- [ ] Superar cinco redirects produce check fallido y no ejecuta un sexto salto.
- [ ] Monitores sin headers mantienen el comportamiento actual de `fetch`, incluida su política de redirects.
- [ ] Usuario B no puede leer ni modificar la configuración del monitor del usuario A mediante los flujos de la aplicación.
- [ ] Tests de schema, servicio y `run-checks` pasan.
- [ ] `pnpm build:web`, `pnpm test:web`, `pnpm lint` y `git diff --check` terminan correctamente.
- [ ] Smoke manual confirma creación, check exitoso, edición con conservación/reemplazo/borrado y ausencia del valor guardado en estado o respuestas del navegador.

## Decisiones

- **Sí:** headers por monitor. Permite credenciales y configuración distintas para cada endpoint.
- **No:** headers globales por usuario o herencia con overrides. Añaden precedencia y edición fuera del alcance.
- **Sí:** columna `request_headers` JSONB en `uptime_monitors`. El límite de 20 elementos no justifica una tabla y consultas adicionales.
- **No:** tabla relacionada por header. Mayor complejidad de RLS, joins y escrituras sin beneficio actual.
- **Sí:** editor de filas clave/valor. Ofrece validación y operaciones claras.
- **No:** objeto JSON o texto HTTP crudo. Trasladan errores de sintaxis al usuario y complican mensajes por fila.
- **Sí:** ocultar todos los valores persistidos y devolver solo nombre más estado configurado.
- **No:** revelar valores al propietario ni elegir secreto por fila. Reduce exposición accidental y mantiene un único modelo.
- **Sí:** persistir valores sin cifrado app-level, protegidos por RLS y límites server-side, siguiendo Telegram y Slack.
- **No:** cifrado app-level en esta spec. Requeriría gestión y rotación de claves.
- **Sí:** conservar, reemplazar o borrar por nombre case-insensitive; nombres persistidos quedan fijos en UI.
- **No:** IDs persistentes por header y renombrado directo. Renombrar se resuelve borrando y añadiendo.
- **Sí:** máximo 20 headers, nombre de 100 caracteres, valor de 2000 y duplicados case-insensitive rechazados.
- **No:** valores vacíos. Entrarían en conflicto con la operación de conservar un valor oculto.
- **Sí:** denylist concreta de headers de transporte y hop-by-hop.
- **No:** allowlist estricta. Impediría headers legítimos de autenticación y APIs privadas.
- **Sí:** permitir `Authorization`, `Cookie`, `User-Agent` y headers custom válidos.
- **Sí:** exigir HTTPS cuando existan headers. Evita transmitir secretos en texto claro.
- **Sí:** aplicar headers a checks `GET` y `HEAD`; no se añaden métodos ni body.
- **Sí:** seguir hasta cinco redirects solo del mismo origen para monitores con headers.
- **No:** reenviar headers a otro origen. Riesgo de fuga de credenciales.
- **No:** cambiar redirects de monitores sin headers. Evita regresiones en checks existentes.
- **Sí:** redirect cross-origin produce fallo con status `3xx` y diagnóstico explícito.
- **Sí:** conservar status, incidentes y contador al editar headers. El siguiente check determina el efecto operativo.
- **No:** toggle por header. Una fila guardada está activa; quitarla la desactiva.
- **Sí:** smoke manual con endpoint HTTPS que exige un header, además de pruebas automatizadas. Verifica flujo real sin crear un botón de prueba nuevo.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Un valor sensible queda legible para administradores de base de datos | Aceptar explícitamente almacenamiento sin cifrado app-level; proteger filas con RLS y no serializar valores al cliente. |
| Un valor aparece accidentalmente en respuestas, errores o logs | Mapear siempre a `RequestHeaderMetadata`, usar errores sanitizados y añadir tests negativos sobre list/create/update, checks y notificaciones. |
| Un redirect filtra credenciales a otro host | Exigir HTTPS, usar redirects manuales y comparar `URL.origin` antes de ejecutar cada salto. |
| Configuración JSONB corrupta por una escritura fuera de la aplicación rompe un check | Validar `request_headers` en cada lectura server-side, aislar cada monitor con `Promise.allSettled` y registrar solo un error sanitizado. |
| `fetch` rechaza un header permitido por reglas de aplicación en una versión concreta del runtime | Tratar la excepción como fallo normal del check sin exponer el valor y cubrir headers comunes con tests. |
| Dos ediciones concurrentes pisan cambios al resolver conservar/reemplazar/borrar | Mantener semántica last-write-wins existente y resolver el merge completo dentro de una única operación del servicio; versionado optimista queda fuera. |
| Cambiar lógica de redirects causa regresiones en monitores actuales | Activar flujo manual únicamente cuando `request_headers` no está vacío y añadir test explícito del camino sin headers. |

## Qué **no** está en esta spec

- Headers globales por usuario o herencia con overrides.
- Cifrado app-level o revelado de valores persistidos.
- Tabla separada, IDs, renombrado directo o toggle por header.
- Valores vacíos.
- Redirects cross-origin con headers.
- Cambios de redirects para monitores sin headers.
- Métodos distintos de GET/HEAD, request body o validación de contenido.
- Registro de headers en checks, incidentes, alertas o logs.
- Botón dedicado para probar headers.
- Soporte en CLI o API pública.

Cada elemento, si entra, irá en su propia spec.

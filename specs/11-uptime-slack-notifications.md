# SPEC 11 — Alertas de Uptime Monitor por Slack

> **Estado:** APROBADO
> **Depende de:** SPEC 09 (Uptime Monitor)
> **Fecha:** 2026-07-22
> **Objetivo:** Enviar alertas de caída y recuperación por Slack mediante un Incoming Webhook global por usuario, sin que los fallos de Slack interrumpan Telegram ni el cron.

## Alcance

**Incluye:**

- Extender `uptime_notification_settings` con configuración global de Slack por usuario.
- Guardar una URL de Incoming Webhook y un toggle de activación.
- Exigir un webhook guardado antes de habilitar Slack.
- Aceptar únicamente URLs HTTPS del host oficial de Slack.
- Mantener el webhook oculto después de guardarlo, permitiendo reemplazarlo o borrarlo.
- Agregar un diálogo independiente para configurar Slack y enviar un mensaje de prueba con la configuración guardada.
- Enviar alertas de caída y recuperación con bloques simples, texto fallback y resumen operativo.
- Crear un despachador común para entregar cada transición a Telegram y Slack de manera independiente.
- Registrar fallos de Slack en logs del servidor sin interrumpir el cron ni otros canales.
- Añadir pruebas del cliente Slack, despachador, validación, acciones y transiciones multicanal.

**Fuera de alcance para specs futuras:**

- Alertas por Discord o correo.
- OAuth de Slack, instalación de una Slack App o selección de canales desde Forge.
- Configuración de canales por monitor.
- Reintentos, colas o persistencia del historial de entregas.
- Alertas para el primer check o para cada check fallido.
- Cifrado de webhooks en aplicación.
- Unificación visual de los diálogos de Telegram y Slack.
- Cambios en la configuración o comportamiento actual de Telegram, salvo su conexión al despachador común.

## Modelo de datos

Se extiende la tabla existente `uptime_notification_settings`; no se crean tablas nuevas.

```ts
type SlackNotificationSettings = {
  userId: string;
  slackConfigured: boolean;
  slackEnabled: boolean;
  updatedAt: string;
};

type SlackNotificationSettingsInput = {
  slackWebhookUrl?: string;
  slackEnabled: boolean;
  clearSlackWebhook: boolean;
};

type UptimeAlertEvent = {
  kind: "down" | "recovery";
  monitorName: string;
  monitorUrl: string;
  occurredAt: string;
  statusCode: number | null;
  latencyMs: number | null;
  error: string | null;
};

type NotificationDeliveryResult = {
  channel: "telegram" | "slack";
  ok: boolean;
  error?: string;
};
```

**Cambios SQL en `uptime_notification_settings`:**

```sql
slack_webhook_url text null
slack_enabled boolean not null default false
```

**Reglas:**

- `slackWebhookUrl` no vacío reemplaza el webhook guardado.
- `slackWebhookUrl` vacío u omitido conserva el webhook existente.
- `clearSlackWebhook: true` elimina el webhook y fuerza `slackEnabled: false`.
- `slackEnabled: true` requiere un webhook existente o uno válido incluido en la misma operación.
- La URL debe usar HTTPS y pertenecer al host oficial permitido de Slack.
- Las consultas usadas por la UI nunca devuelven `slack_webhook_url`; solo exponen `slackConfigured`.
- El despachador recibe un `UptimeAlertEvent` y devuelve un resultado independiente por canal.
- Los resultados de entrega no se persisten; los fallos se escriben en logs del servidor.
- RLS existente continúa limitando cada fila de configuración a su propietario.

## Plan de implementación

1. Crear una migración en `migrations/` que agregue `slack_webhook_url` y `slack_enabled` a `uptime_notification_settings`, conservando intactas las filas existentes y dejando Slack deshabilitado por defecto.
2. Extender `types/index.ts` y `schemas/uptime-monitor-schema.ts` con `SlackNotificationSettings`, `SlackNotificationSettingsInput`, validación del host oficial y reglas para guardar, reemplazar o borrar el webhook.
3. Extender `services/uptime-monitor-service.ts` con lectura pública sin webhook, guardado parcial y obtención server-only del webhook para entregas y pruebas.
4. Crear `server/slack.ts` con el cliente de Incoming Webhooks y el formateador de bloques para caída, recuperación y mensaje de prueba; verificar respuestas HTTP, errores de red y payloads mediante `server/slack.test.ts`.
5. Crear `server/notifications.ts` con el despachador común de `UptimeAlertEvent`; ejecutar Telegram y Slack independientemente, conservar el comportamiento actual de Telegram y registrar cada fallo sin lanzar un error global.
6. Refactorizar `server/run-checks.ts` para construir un único evento en cada transición y entregarlo mediante el despachador; ampliar sus pruebas para cubrir caída, recuperación, canales deshabilitados y fallo aislado de Slack.
7. Añadir en `actions.ts` acciones autenticadas para consultar y guardar Slack, borrar el webhook y enviar una prueba usando únicamente la configuración persistida.
8. Añadir en `hooks/queries.ts` y `hooks/mutations.ts` las consultas y mutaciones de Slack, con invalidación de caché y mensajes de éxito o error.
9. Crear `components/slack-settings-dialog.tsx` con estado configurado, toggle, campo para reemplazar el webhook, acción explícita para borrarlo y botón de prueba.
10. Integrar un acceso independiente a la configuración de Slack desde `uptime-monitor.tsx`, sin modificar el diálogo existente de Telegram.
11. Ejecutar los tests focalizados de Uptime Monitor, `pnpm build` y `pnpm lint`; después hacer una prueba manual guardando un webhook, enviando el mensaje de prueba y provocando transiciones de caída y recuperación con Telegram y Slack habilitados.

## Criterios de aceptación

- [ ] Una migración agrega `slack_webhook_url` y `slack_enabled` sin alterar la configuración existente de Telegram.
- [ ] Slack queda deshabilitado por defecto para filas nuevas y existentes.
- [ ] Usuario autenticado puede guardar un Incoming Webhook válido de `hooks.slack.com`.
- [ ] Una URL HTTP, un host distinto o una URL malformada se rechaza en servidor.
- [ ] La UI indica si Slack está configurado sin devolver ni mostrar el webhook guardado.
- [ ] Usuario puede reemplazar el webhook sin conocer su valor anterior.
- [ ] Borrar el webhook también deshabilita Slack.
- [ ] No se puede habilitar Slack sin un webhook guardado o proporcionado en la misma operación.
- [ ] El diálogo de Slack permanece separado del diálogo existente de Telegram.
- [ ] El botón de prueba falla con un mensaje claro si no existe configuración guardada.
- [ ] El botón de prueba usa exclusivamente el webhook persistido y confirma éxito o fallo en la UI.
- [ ] Cada alerta de Slack contiene texto fallback y bloques con estado, monitor, URL, hora, código o error y latencia cuando corresponda.
- [ ] Una transición a `down` genera exactamente una alerta de caída en Slack.
- [ ] Una transición de `down` a `up` genera exactamente una alerta de recuperación en Slack.
- [ ] Checks posteriores sin cambio de estado no generan alertas adicionales.
- [ ] Con Telegram y Slack habilitados, el despachador intenta ambos canales.
- [ ] Un fallo de Slack queda registrado en logs y no impide el envío por Telegram ni rompe el cron.
- [ ] Slack deshabilitado o no configurado se omite sin producir errores.
- [ ] La conexión de Telegram al despachador conserva sus mensajes de caída, recuperación y prueba actuales.
- [ ] Usuario B no puede consultar ni modificar la configuración Slack del usuario A.
- [ ] El webhook de Slack no aparece en respuestas cliente, logs ni bundle del navegador.
- [ ] Pruebas unitarias cubren validación, cliente Slack, bloques, despachador y transiciones multicanal.
- [ ] Tests focalizados, `pnpm build` y `pnpm lint` terminan correctamente.

## Decisiones

- **Sí:** dividir la mejora multicanal en tres specs independientes para Slack, Discord y correo. Reduce alcance y permite verificar cada proveedor por separado.
- **Sí:** implementar Slack primero. Incoming Webhooks ofrece el flujo más pequeño sobre SPEC 09.
- **Sí:** usar Incoming Webhooks configurados por el usuario. OAuth, bots e instalación de una Slack App se descartan para esta spec.
- **Sí:** mantener configuración global por usuario. Destinos distintos por monitor quedan para otra spec.
- **Sí:** enviar cada transición a todos los canales habilitados de manera independiente.
- **Sí:** crear `server/notifications.ts` como despachador común para Telegram y Slack. Discord y correo podrán conectarse después sin reescribir el cron.
- **Sí:** mantener diálogos separados para Telegram y Slack. Se descarta un panel visual unificado.
- **Sí:** guardar `slack_webhook_url` en texto plano protegido por RLS, siguiendo el patrón existente de Telegram. Se descarta cifrado en aplicación por ahora.
- **Sí:** aceptar únicamente webhooks HTTPS del host oficial `hooks.slack.com`. Se descartan proxies y destinos arbitrarios.
- **Sí:** ocultar el webhook después de guardarlo. La UI solo muestra si existe y permite reemplazarlo o borrarlo.
- **Sí:** exigir un webhook persistido antes de habilitar Slack. Borrarlo deshabilita el canal.
- **Sí:** probar únicamente la configuración guardada. Se descarta enviar valores temporales del formulario.
- **Sí:** usar bloques simples de Slack con texto fallback y resumen operativo.
- **Sí:** enviar alertas solo en transiciones de caída y recuperación. Se descartan primer check y mensajes por cada fallo.
- **Sí:** registrar fallos en logs del servidor y continuar con los demás canales.
- **No:** reintentos, colas o tabla de entregas. Requieren otra spec con política de idempotencia y retención.
- **No:** Discord y correo en esta spec. Cada canal tendrá su propia definición.
- **No:** modificar el comportamiento visible de Telegram, salvo conectarlo al despachador común.

## Riesgos

| Riesgo                                                             | Mitigación                                                                                                                       |
| ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| Webhook filtrado permite publicar mensajes en el canal             | No devolverlo en consultas cliente, no incluirlo en logs y permitir reemplazarlo o borrarlo desde la UI.                         |
| Webhook revocado o Slack no disponible causa pérdida de una alerta | Registrar el fallo sin romper el cron; ofrecer mensaje de prueba para validar configuración. Reintentos quedan fuera de alcance. |
| Refactor del flujo actual introduce regresiones en Telegram        | Mantener su formateador y cliente actuales; añadir pruebas del despachador con ambos canales habilitados.                        |
| Ejecuciones solapadas generan alertas duplicadas                   | Conservar la lógica de SPEC 09 que alerta solo durante una transición real de estado.                                            |
| Payload de bloques rechazado por Slack                             | Validar estructura con pruebas del cliente y tratar cualquier respuesta HTTP no exitosa como fallo aislado.                      |
| Usuario habilita Slack con una configuración inválida o ausente    | Validar host y formato en servidor; impedir activación sin webhook persistido.                                                   |
| Logs incluyen accidentalmente la URL secreta                       | Registrar únicamente canal, monitor y mensaje sanitizado; nunca request URL, payload completo ni credenciales.                   |

## Qué **no** está en esta spec

- Alertas por Discord o correo.
- OAuth de Slack, bots o instalación de una Slack App.
- Selección de canales de Slack desde Forge.
- Destinos diferentes por monitor.
- Reintentos, colas o historial persistente de entregas.
- Cifrado de secretos en aplicación.
- Alertas para cada check fallido o para el primer resultado.
- Unificación visual de configuraciones de notificación.
- Cambios funcionales en Telegram fuera del despachador común.

Cada elemento, si entra, irá en su propia spec.

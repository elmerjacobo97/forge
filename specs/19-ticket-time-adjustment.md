# SPEC 19 — Ajuste de tiempo de tickets y aviso de sesión larga

> **Estado:** Aprobado
> **Depende de:** SPEC 03 — CLI Forge para tickets; SPEC 04 — Dev Board proyectos; SPEC 17 — Loop de agente sobre tickets (tabla de comentarios)
> **Fecha:** 2026-09-12
> **Objetivo:** Permitir corregir el tiempo registrado de un ticket (retro-pausa, editar o borrar su última sesión, con rastro en comentarios) y avisar en el board cuando una sesión activa supera el umbral.

## Alcance

**Incluye:**

- Migración `migrations/20260912120000_adjust-ticket-time.sql` con el RPC nuevo `adjust_dev_board_ticket_time` y cuatro acciones: `stop_at`, `set_last_duration`, `delete_last` y `set_total` (solo cuando el ticket no tiene ninguna time entry).
- Cálculo consistente: tras cada ajuste, `total_elapsed_ms` se recalcula como la suma de `duration_ms` de las time entries del ticket.
- Comentario de auditoría con autor `user` cuando la duración cambia: `set_last_duration`, `delete_last` y `stop_at` con hora distinta de "ahora". Formato "Timer adjusted: 4h 02m → 1h 00m"; el borrado usa "→ removed".
- Web: dialog `Adjust time` con inputs de horas/minutos, presets 30m/1h/2h/4h y preview del end time resultante; edita la sesión actual si el timer corre y la última sesión si está detenido.
- Item "Adjust time" en el menú de la tarjeta cuando `timerActive || totalElapsedMs > 0`.
- Prompt al mover un ticket fuera de columna timer si la sesión supera las 2 horas: Keep / Adjust (Adjust abre el dialog).
- Banner de sesiones largas en el board: hasta 3 tickets ordenados por tiempo, con acciones Adjust / Pause / X; dismiss por sesión en `sessionStorage`.
- Fix de anclaje de la notificación browser existente: usa `timer_started_at` en vez de `last_moved_at`; umbral de 25 minutos intacto.
- Tests web de schemas, servicios, actions, helpers de tiempo, utilidades stale y dialog (patrón jsdom existente).
- Auditoría one-off posterior: query de solo lectura a `dev_board_time_entries` con duraciones > 3h, reporte en el chat.
- Uso del ticket real olvidado como smoke test: aplicar migración, corregirlo con el dialog y verificar card + analytics.

**Fuera de alcance (para specs futuras):**

- Tool MCP de escritura y comando `forge-cli ticket adjust-time`; el MCP remoto sigue read-only.
- Auto-pausa por cron con InsForge schedules.
- Notificaciones por email o push fuera de la plataforma.
- Botón de ajuste en la página de Analytics; Analytics sigue siendo solo lectura.
- Migración de toasts de `sonner` a `sileo` (ticket separado).
- Edición de cualquier time entry: solo la última (o la sesión en curso).
- Vista con historial completo de sesiones por ticket.
- Nuevo tipo de evento en `dev_board_events`; la auditoría va por comentarios.
- Timeline o feed de actividad en la web.
- Garantía de que el banner vea tickets fuera de la primera página (25 por columna).
- Cambios en `apps/web/src/components/ui` y en el esquema de tablas existentes (la migración solo crea una función).

## Data model

Esta spec no crea tablas ni columnas. Reutiliza `dev_board_tickets`, `dev_board_time_entries`, `dev_board_events` y `dev_board_ticket_comments` (SPEC 17). La migración solo crea una función.

RPC nuevo (mismo patrón que `set_dev_board_ticket_timer`, `SECURITY DEFINER`, `search_path` fijo, ownership con `FOR UPDATE`):

```sql
CREATE OR REPLACE FUNCTION public.adjust_dev_board_ticket_time(
  p_ticket_id UUID,
  p_action TEXT,
  p_ended_at TIMESTAMPTZ DEFAULT NULL,
  p_duration_ms BIGINT DEFAULT NULL
) RETURNS public.dev_board_tickets
```

Reglas por acción:

- `stop_at`: exige columna timer y `timer_started_at` no nulo. Valida `timer_started_at <= p_ended_at <= now`. Inserta la time entry cerrada, setea `timer_started_at = NULL` e `is_paused = true`, y emite evento `paused` (tipo existente; sin tocar el CHECK de `dev_board_events`).
- `set_last_duration`: toma la última entry por `started_at desc`. Valida `p_duration_ms >= 0`. Calcula `ended_at = started_at + duration_ms` y exige `<= now`. Con `0` elimina la entry; con otro valor la actualiza.
- `delete_last`: elimina la última entry.
- `set_total`: solo válido si el ticket no tiene ninguna entry; asigna `total_elapsed_ms = p_duration_ms`.
- Tras `stop_at`, `set_last_duration` y `delete_last`, `total_elapsed_ms` se recalcula como `COALESCE(SUM(duration_ms), 0)` de las entries del ticket. Las entries son la única fuente de verdad.
- Comentario de auditoría en `dev_board_ticket_comments` con `author = 'user'` cuando la duración cambia. `stop_at` solo comenta si `now - p_ended_at > interval '1 minute'` (el default "ahora" de la UI no genera ruido). Formato: `Timer adjusted: 4h 02m → 1h 00m`; el borrado usa `→ removed`.

Tipos y schemas web:

```ts
export type TicketTimeAdjustAction = "stop_at" | "set_last_duration" | "delete_last" | "set_total";

export const ticketTimeAdjustSchema = z.discriminatedUnion("action", [
  z.object({ ticketId: z.uuid(), action: z.literal("stop_at"), endedAt: z.iso.datetime() }),
  z.object({
    ticketId: z.uuid(),
    action: z.literal("set_last_duration"),
    durationMs: z.number().int().min(0),
  }),
  z.object({ ticketId: z.uuid(), action: z.literal("delete_last") }),
  z.object({
    ticketId: z.uuid(),
    action: z.literal("set_total"),
    durationMs: z.number().int().min(0),
  }),
]);
```

El dialog lee la última entry con el tipo `TimeEntry` ya existente (`types/analytics.ts`) mediante un método nuevo `devBoardService.lastTimeEntry(ticketId)`.

Constantes:

- `STALE_BANNER_THRESHOLD_MS = 7_200_000` (2h) en `types/board.ts`.
- `STALE_BANNER_MAX = 3` tickets visibles en el banner.
- `STALE_THRESHOLD_MS = 25 min` (existente) se conserva para la notificación browser.

## Plan de implementación

1. Crear `migrations/20260912120000_adjust-ticket-time.sql` con el RPC `adjust_dev_board_ticket_time`: las cuatro acciones, validaciones, comentario de auditoría y recálculo de `total_elapsed_ms`. Es aditiva: no toca tablas, RLS ni grants. Pedir al usuario aplicarla con InsForge CLI antes de la verificación manual; ningún paso posterior depende de ella para correr tests. Rollback documentado: `DROP FUNCTION IF EXISTS public.adjust_dev_board_ticket_time(UUID, TEXT, TIMESTAMPTZ, BIGINT)`.
2. Web schemas y tipos: `ticketTimeAdjustSchema` (union discriminada) en `schemas/ticket.ts`; `STALE_BANNER_THRESHOLD_MS = 7_200_000` y `STALE_BANNER_MAX = 3` en `types/board.ts`. Tests de parsing para cada acción.
3. Web servicio: `adjustTicketTime(input)` invoca el RPC y `lastTimeEntry(ticketId)` lee la última time entry (grant SELECT ya existente), reutilizando el tipo `TimeEntry`. Tests de servicio con los mocks de InsForge existentes.
4. Web actions: `adjustTicketTimeAction` y `getLastTimeEntryAction`, con re-check de sesión y validación Zod, siguiendo el patrón de `updateTicketAction`. Tests de auth y parseo.
5. Helpers de tiempo en `utils/timer.ts`: H/M a ms, ms a partes, preview de `ended_at`. Tests unitarios.
6. Dialog `ticket-time-dialog.tsx`: inputs H/M, presets 30m/1h/2h/4h y preview del end time. Con timer corriendo envía `stop_at`; detenido edita (`set_last_duration`) o borra (`delete_last`) la última sesión; sin entries muestra el fallback `set_total`. Estados de carga, error y toast. Test jsdom siguiendo `password-generator.test.tsx`.
7. Menú de tarjeta: item "Adjust time" con icono Clock visible cuando `timerActive || totalElapsedMs > 0`; prop `onAdjust` por `ticket-card.tsx` y `column-view.tsx`.
8. `project-board.tsx`: estado del dialog, update del board con el ticket devuelto, incremento local de `commentCount` cuando hubo comentario, y prompt post-move (`stale-move-prompt.tsx`) al salir de una columna timer con sesión mayor a 2h: Keep / Adjust.
9. Banner: `utils/stale-banner.ts` (detección por `timer_started_at` + dismiss por sesión en `sessionStorage`) y `components/stale-tickets-banner.tsx` (hasta 3 tickets, Adjust / Pause / X) arriba de las columnas. Tests de la utilidad.
10. Fix de `utils/stale-alert.ts`: anclar la notificación browser a `timerStartedAt` en lugar de `lastMovedAt`, manteniendo los 25 minutos. Crear `stale-alert.test.ts` (hoy no existe) cubriendo el falso positivo post-resume.
11. Verificación: `pnpm test:web`, `pnpm build:web`, `pnpm lint` y Prettier solo sobre los archivos tocados. Luego aplicar la migración, corregir el ticket real olvidado y revisar card + analytics.

## Criterios de aceptación

**Migración y RPC:**

- [ ] `adjust_dev_board_ticket_time` existe tras aplicar la migración; no altera tablas, RLS ni grants.
- [ ] Un usuario que no es dueño del ticket recibe error; el ticket ajeno no cambia.
- [ ] `stop_at` con timer corriendo cierra la time entry, deja `timer_started_at = NULL` e `is_paused = true`.
- [ ] `stop_at` rechaza `p_ended_at` anterior a `timer_started_at` o posterior a `now`.
- [ ] `stop_at` con hora pasada inserta comentario `Timer adjusted: X → Y`; con la hora actual no comenta.
- [ ] `set_last_duration` actualiza `ended_at` y `duration_ms`; con `0` elimina la entry; rechaza duraciones que terminen en el futuro.
- [ ] `delete_last` elimina la última entry por `started_at desc`.
- [ ] `set_total` funciona solo sin entries; con entries existentes falla con mensaje claro.
- [ ] Tras cualquier ajuste, `total_elapsed_ms` es igual a la suma de `duration_ms` de las entries (verificable en la tarjeta y en `forge-cli ticket get`).

**Web — ajuste:**

- [ ] El menú de la tarjeta muestra "Adjust time" cuando el timer está activo o `totalElapsedMs > 0`.
- [ ] Con el timer corriendo, el dialog muestra la sesión actual, presets y preview del end time; guardar con "ahora" pausa el timer.
- [ ] Con el timer detenido, el dialog edita la última sesión; borrarla deja el total en la suma de las entries restantes.
- [ ] Sin entries y con `totalElapsedMs > 0`, el dialog muestra el fallback "Set total time".
- [ ] Un ajuste exitoso actualiza la tarjeta sin recargar, incluido el `commentCount` cuando hubo comentario.
- [ ] Un error del RPC muestra toast y el board queda consistente.
- [ ] Mover un ticket fuera de columna timer con sesión mayor a 2h muestra Keep / Adjust; Keep cierra el aviso sin cambios y Adjust abre el dialog.
- [ ] Mover con sesión de 2h o menos no muestra prompt.

**Web — banner y notificación:**

- [ ] El banner lista tickets corriendo más de 2h, ordenados por tiempo descendente, máximo 3.
- [ ] Adjust abre el dialog del ticket correspondiente; Pause pausa sin recargar la página; X lo oculta por sesión y no reaparece al refrescar dentro de la misma sesión.
- [ ] Un ticket pausado o con timer detenido no aparece en el banner.
- [ ] Tras ajustar o pausar, el ticket desaparece del banner.
- [ ] La notificación browser usa `timer_started_at` y ya no se dispara al reanudar un timer pausado hacía mucho.

**General:**

- [ ] No se modifica ningún archivo bajo `apps/web/src/components/ui`.
- [ ] `pnpm test:web`, `pnpm build:web` y `pnpm lint` pasan; los archivos tocados están formateados.
- [ ] La migración fue aplicada con InsForge CLI y el smoke con el ticket real se verificó en tarjeta y analytics.
- [ ] La auditoría one-off de entries mayores a 3h quedó reportada en el chat.
- [ ] El rollback (`DROP FUNCTION`) quedó documentado; no se ejecuta en producción.

## Decisiones

- **Sí:** ajuste retroactivo con RPC nuevo sobre las time entries. Son la fuente de verdad de Analytics; pisar `total_elapsed_ms` solo no corrige las estadísticas.
- **Sí:** cuatro acciones (`stop_at`, `set_last_duration`, `delete_last`, `set_total`). Editor de cualquier segmento descartado: agrega UI de listado sin cubrir casos reales nuevos.
- **Sí:** ajustar un ticket corriendo lo deja pausado, consistente con el modelo de columna timer; "seguir corriendo" se logra con Resume.
- **Sí:** extender duración permitido dentro de `[started_at, now]`; sin tope artificial; duración `0` elimina la entry en vez de dejar una sesión vacía.
- **Sí:** auditoría por comentario con autor `user` (formato `Timer adjusted: X → Y`). Evento `adjusted` descartado: exigiría migrar el CHECK, `EVENT_TYPES` del core y el zod de Analytics, y un comentario ya es visible en la UI.
- **Sí:** el comentario se omite cuando `stop_at` cae en "ahora" (tolerancia de 1 minuto); pausar normal no debe llenar el hilo.
- **Sí:** prompt Keep / Adjust al mover fuera de columna timer con sesión mayor a 2h. Preguntar siempre descartado: fricción diaria.
- **Sí:** banner persistente en el board (máximo 3, orden por tiempo, Adjust / Pause / X, dismiss por sesión). Toast descartado: se autodestruye antes de que reacciones.
- **Sí:** detección stale anclada en `timer_started_at`. `last_moved_at` descartado: resume no lo actualiza y produce falsos positivos.
- **Sí:** fix mínimo de la notificación browser existente (mismo anclaje, umbral de 25 min intacto). Eliminarla descartado: sigue siendo útil en sesiones normales.
- **Sí:** el banner considera solo los tickets cargados (25 por columna). Query dedicada descartada por optimización prematura; se acota en la spec.
- **Sí:** limpieza histórica como auditoría one-off con query de solo lectura. Vista permanente de sesiones descartada por ahora.
- **Sí:** sin tool MCP de escritura ni comando CLI de ajuste. El MCP remoto mantiene su contrato read-only (SPEC 18) y la web-first cubre el caso.
- **Sí:** ticket separado para la migración `sonner` → `sileo`; no mezclar 8 features en este fix.
- **Sí:** un ticket por feature en Forge (adjust, banner, sileo) para que las stats semanales reflejen el trabajo real.
- **Sí:** branch dedicado, commits por unidad y PR con validaciones, como el resto del repo.
- **No:** auto-pausa por cron. Puede cortar trabajo legítimo; si el olvido persiste, se evalúa en su propia spec.
- **No:** email o push. Infra y spam para un problema que el banner resuelve al volver.
- **No:** botón de ajuste en Analytics; esa vista se mantiene de solo lectura.
- **No:** nuevo tipo de evento `adjusted`; la tabla de eventos conserva sus seis valores.
- **No:** cambios en `apps/web/src/components/ui`.

## Riesgos

| Riesgo                                                                      | Mitigación                                                                                                                                 |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Ajustar `ended_at` mueve el tiempo registrado a otro día en `loggedTime`    | Aceptado y documentado: `loggedTime` agrupa por `ended_at`; el usuario elige la hora real en la que dejó de trabajar.                      |
| `set_total` rompe la invariante si convive con entries                      | El RPC lo rechaza con error claro cuando existen entries; caso cubierto en los tests de servicio.                                          |
| La hora "ahora" de la UI casi nunca coincide con `now` del servidor         | Tolerancia de 1 minuto para el comentario de auditoría, documentada y testeada; pausar normal nunca comenta.                               |
| Carrera entre un ajuste y un move/pause concurrente                         | El RPC toma el ticket con `FOR UPDATE`, igual que `move_dev_board_ticket` y `set_dev_board_ticket_timer`.                                  |
| El banner solo ve la primera página (25 por columna) y omite tickets viejos | Limitación declarada en el alcance; si duele, se resuelve con una query dedicada en su propia spec.                                        |
| Prompt de Keep / Adjust con trabajo legítimo mayor a 2h                     | El prompt aparece después del move y no lo bloquea; Keep cierra sin cambios. Adjust es opcional.                                           |
| Doble submit del dialog duplica pausas o comentarios                        | Botón deshabilitado durante el envío y estado de carga; `stop_at` falla si el timer ya no está corriendo.                                  |
| `delete_last` borra la única sesión por error                               | Sin undo; el comentario de auditoría registra la duración eliminada (`→ removed`) y el error se hace visible en el hilo del ticket.        |
| La notificación browser sigue necesitando la pestaña abierta                | Fuera de alcance por decisión: el banner cubre el caso real cuando el usuario vuelve al board.                                             |
| Migración aplicada sobre el proyecto compartido                             | Aditiva (solo crea una función) con rollback `DROP FUNCTION`; se aplica con InsForge CLI antes del smoke y se verifica con el ticket real. |

## Qué **no** está en esta spec

- Tool MCP de escritura y comando `forge-cli ticket adjust-time`.
- Auto-pausa por cron con InsForge schedules.
- Notificaciones por email o push.
- Botón de ajuste en Analytics.
- Migración de toasts de `sonner` a `sileo`.
- Edición de cualquier time entry y vista de historial completo de sesiones.
- Nuevo tipo de evento `adjusted` en `dev_board_events`.
- Timeline o feed de actividad en la web.
- Garantía de cobertura del banner sobre tickets fuera de la primera página.
- Cambios en `apps/web/src/components/ui`.

Cada elemento futuro deberá definirse en su propia spec.

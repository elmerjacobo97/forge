# SPEC 29 — Ajuste de tiempo flexible con el timer corriendo

> **Estado:** Implementado  
> **Depende de:** SPEC 19 — Ajuste de tiempo de tickets (Web y RPC) · SPEC 20 — Ajuste de tiempo en CLI  
> **Fecha:** 2026-09-30  
> **Objetivo:** Permitir que, con el timer corriendo, el usuario fije cualquier duración en el diálogo "Adjust time", sin el tope del tiempo transcurrido.

## Scope

**Incluye:**

- Quitar en el diálogo el tope de la sesión en curso: presets, inputs y botón de guardado dejan de bloquearse por exceder el tiempo transcurrido.
- Nueva acción RPC `stop_with_duration`: detiene el timer ahora y registra una sesión de la duración pedida que termina en `now`; `started_at` se mueve hacia atrás.
- Duración menor o igual al tiempo transcurrido (+1 min de tolerancia): se mantiene `stop_at` sin cambios.
- Comentario de auditoría `Timer adjusted: <antes> → <después>` en la nueva acción.
- Tests de schema y diálogo.

**Fuera de alcance (para specs futuras):**

- Editar manualmente hora de inicio y fin de una sesión.
- Añadir sesiones manuales o editar sesiones que no sean la última.
- CLI y MCP.
- Detectar o impedir solapamiento con sesiones anteriores.

## Data model

Sin cambios de tablas, RLS ni grants. La migración `20260930120000_adjust-running-time-extend.sql` reemplaza `adjust_dev_board_ticket_time` con las acciones de SPEC 19 más `stop_with_duration` (`p_duration_ms > 0`, timer corriendo, ticket en `in_progress` o `validation`).

## Criterios de aceptación

- [x] Con timer corriendo, se puede guardar una duración mayor al tiempo transcurrido.
- [x] El resultado es una sesión de esa duración que termina ahora, timer pausado y `total_elapsed_ms` recalculado.
- [x] Acortar la sesión sigue usando `stop_at`.
- [x] Los modos `last` y `total` no cambian.

## Decisiones

- **Sí:** mover `started_at` hacia atrás. **No:** permitir fin en el futuro (`stop_at` sigue rechazándolo).
- **Sí:** aceptar solapamiento con sesiones previas, igual que `set_last_duration`. **No:** validar contra vecinas, por complejidad.
- **Sí:** nueva acción en la RPC existente. **No:** nueva función.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Solapamiento con sesiones previas infla el total | Comentario de auditoría; el usuario controla el valor |
| Duraciones absurdas por error de tecleo | El preview muestra la hora de inicio resultante antes de guardar |

## Qué no está en esta spec

Cada elemento futuro deberá definirse en su propia spec.

# SPEC 20 — CLI: ajuste de tiempo de tickets

> **Estado:** Implementado
> **Depende de:** SPEC 03 — CLI Forge para tickets; SPEC 17 — Loop de agente sobre tickets; SPEC 19 — Ajuste de tiempo de tickets (RPC y semántica)
> **Fecha:** 2026-09-12
> **Objetivo:** Permitir ajustar el tiempo registrado de un ticket desde `forge-cli` (editar o borrar la última sesión y retro-detener la corrida actual) con el mismo RPC y la misma auditoría que la web.

## Alcance

**Incluye:**

- Comando `forge-cli ticket adjust-time <id>` con flags mutuamente excluyentes: `--set <duration>` (`set_last_duration`), `--remove-last` (`delete_last`) y `--stop-at <now|ISO>` (`stop_at`).
- Duración con unidad obligatoria: `30m`, `90m`, `1h30m`, `2h`.
- Core: `parseDurationMs` + `ticketTimeAdjustSchema` + `parseTicketTimeAdjustInput` en `ticket-schema.ts`; método `adjustTime` en `dev-board-service.ts`; tipo `TicketTimeAdjustInput` en `types.ts`.
- Salida de texto y `--json` (Ticket completo, igual que `move`); errores `{"error":{"message":"..."}}` en stderr con exit 1.
- Tests de core (schema y service con el mock de InsForge) y actualización de `TICKET_HELP`.
- Docs: `apps/cli/README.md` y skill global `forge-tickets` (comando, flags y semántica).

**Fuera de alcance (para specs futuras):**

- Tool MCP de escritura; el MCP remoto mantiene su contrato read-only (SPEC 18).
- `--set-total`: el fallback `set_total` queda solo para la web.
- Comandos `pause`/`resume`; `--stop-at now` cubre el caso de detener la corrida.
- Release npm 0.6.0 (bump, tag y publish): ticket aparte.
- Cambios en la web, en el RPC o en migraciones.

## Data model

No hay tablas ni migraciones nuevas: es una capa CLI sobre el RPC ya aplicado `adjust_dev_board_ticket_time` (`migrations/20260912120000_adjust-ticket-time.sql`).

Flags a acciones del RPC:

| Flag                | Acción              | Parámetros                               |
| ------------------- | ------------------- | ---------------------------------------- |
| `--set <duration>`  | `set_last_duration` | `p_duration_ms = parseDurationMs(value)` |
| `--remove-last`     | `delete_last`       | —                                        |
| `--stop-at <value>` | `stop_at`           | `p_ended_at` (ISO; `now` = ahora mismo)  |

Tipos:

```ts
export type TicketTimeAdjustInput =
  { id: string; set: number } | { id: string; removeLast: true } | { id: string; stopAt: string };
```

Reglas de `parseDurationMs`:

- Regex `^(?:(\d+)h)?(?:(\d+)m)?$` case-insensitive, con al menos un grupo.
- Acepta `30m`, `90m`, `1h`, `1h30m`, `2h`; `0m` es válido (el RPC elimina la entry).
- Rechaza vacío, decimales, segundos y negativos. Sin tope artificial: el RPC valida contra `now`.

Semántica CLI ↔ RPC (documentada en help, README y skill):

- `--set` edita la última sesión **cerrada**; con el timer corriendo edita la sesión anterior. Para recortar la corrida actual se usa `--stop-at`.
- `--stop-at now` equivale a pausar desde el CLI: cierra la entry y deja `is_paused = true`.
- Todo ajuste que cambia la duración deja comentario de auditoría; lo escribe el RPC.

## Plan de implementación

1. Core schema: `parseDurationMs`, `ticketTimeAdjustSchema` y `parseTicketTimeAdjustInput` en `ticket-schema.ts`. Tests: formas válidas, cero, rechazos, mutua exclusión y `now`/ISO.
2. Core service: `adjustTime(input)` con `ticketRpc` mapeando a `p_action`/`p_ended_at`/`p_duration_ms`; tipo en `types.ts`. Tests con `createDevBoardMockClient` verificando `rpcCalls` por acción.
3. CLI: `runAdjustTime` en `commands/ticket.ts` (id posicional, `getFlagValue`/`hasFlag`, parser, `service.adjustTime`, `writeTicketOutput`), registro en el router y `TICKET_HELP` con ejemplos.
4. `flags.ts`: agregar `--remove-last` a `BOOLEAN_FLAGS`.
5. Docs: `apps/cli/README.md` (sección Dev Board tickets) y skill global `forge-tickets` (comandos y checklist).
6. Verificación: `pnpm test:core`, `pnpm test:cli`, `pnpm build`, `pnpm lint` y Prettier sobre archivos tocados; smoke manual contra el proyecto real.

## Criterios de aceptación

- [ ] `--set 1h30m` sobre un ticket con sesión cerrada actualiza `duration_ms` y recalcula `total_elapsed_ms` (invariante) y deja comentario `Timer adjusted`.
- [ ] `--remove-last` borra la última entry y recalcula el total.
- [ ] `--stop-at now` cierra la corrida actual y deja el ticket pausado; `--stop-at <ISO>` acepta una hora pasada.
- [ ] Sin flag o con más de uno, exit 1 con mensaje claro.
- [ ] `--set 90` (sin unidad), con decimales o con unidad desconocida, exit 1.
- [ ] `--json` devuelve el Ticket con stdout limpio; los errores van como `{"error":{"message":"..."}}` a stderr con exit 1.
- [ ] Ticket inexistente: `Ticket not found.` con exit 1.
- [ ] `pnpm test:core`, `pnpm test:cli`, `pnpm build` y `pnpm lint` pasan.
- [ ] README y skill documentan el comando y la semántica; el checklist aclara que pause/resume siguen fuera.
- [ ] Smoke manual: ajuste real verificado (comentario de auditoría y total consistente).

## Decisiones

- **Sí:** un comando con flags mutuamente excluyentes, espejo del RPC. Menos superficie que subcomandos.
- **Sí:** duración con unidad obligatoria (`1h30m`). Evita la ambigüedad minutos/horas para agentes.
- **Sí:** `--stop-at` acepta `now`. Cubre el caso "me olvidé de detener" sin salir del CLI.
- **Sí:** `--set` puede editar la sesión anterior con el timer corriendo (lo permite el RPC); se documenta.
- **Sí:** parsing de duración en `packages/forge-core` para reuso y tests en el paquete.
- **No:** `--set-total`; el fallback queda solo para la web.
- **No:** MCP de escritura; el contrato read-only de SPEC 18 se mantiene.
- **No:** comandos `pause`/`resume`; `--stop-at now` cubre el caso.
- **No:** release npm en esta spec; ticket aparte con bump 0.6.0.

## Riesgos

| Riesgo                                                         | Mitigación                                                                                            |
| -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `--set` con el timer corriendo edita la sesión anterior        | Documentado en help, README y skill; `--stop-at` es el flag para la corrida actual.                   |
| Duración que termina en el futuro                              | El RPC rechaza `ended_at > now + 1 min` en `set_last_duration`; el error del RPC se propaga tal cual. |
| Skew de reloj con `--stop-at now`                              | El RPC clampea dentro de 1 minuto.                                                                    |
| `--remove-last` como booleano mal declarado rompe posicionales | Alta en `BOOLEAN_FLAGS`; tests de flags existentes siguen verdes.                                     |
| Deriva entre CLI y web                                         | Ambos usan el mismo RPC; los tests del core verifican los parámetros exactos por acción.              |

## Qué **no** está en esta spec

- MCP write tools.
- `--set-total` y edición de entries arbitrarias (solo la última).
- Comandos pause/resume, analytics y reordenamiento (siguen fuera del CLI).
- Release npm (ticket aparte).
- Cambios en la web, el RPC o las migraciones.

Cada elemento futuro deberá definirse en su propia spec.

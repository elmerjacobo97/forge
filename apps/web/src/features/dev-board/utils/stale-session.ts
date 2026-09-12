import {
  isTimerColumn,
  STALE_BANNER_THRESHOLD_MS,
  type ColumnId,
  type Ticket,
} from "../types/board";
import { computeElapsed } from "./timer";

export function runningSessionMs(ticket: Ticket, now = Date.now()): number | null {
  if (!isTimerColumn(ticket.column) || ticket.isPaused || !ticket.timerStartedAt) return null;
  return computeElapsed(ticket, now);
}

export function isStaleSession(ticket: Ticket, now = Date.now()): boolean {
  const sessionMs = runningSessionMs(ticket, now);
  return sessionMs !== null && sessionMs > STALE_BANNER_THRESHOLD_MS;
}

export function staleSessionMsForMove(
  ticket: Ticket,
  target: ColumnId,
  now = Date.now(),
): number | null {
  if (!isTimerColumn(ticket.column) || isTimerColumn(target)) return null;

  const sessionMs = runningSessionMs(ticket, now);
  if (sessionMs === null || sessionMs <= STALE_BANNER_THRESHOLD_MS) return null;
  return sessionMs;
}

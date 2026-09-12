import {
  isTimerColumn,
  STALE_SESSION_THRESHOLD_MS,
  type ColumnId,
  type Ticket,
} from "../types/board";
import { runningSegmentMs } from "./timer";

export function runningSessionMs(ticket: Ticket, now = Date.now()): number | null {
  if (!isTimerColumn(ticket.column) || ticket.isPaused) return null;
  return runningSegmentMs(ticket, now);
}

export function staleSessionMsForMove(
  ticket: Ticket,
  target: ColumnId,
  now = Date.now(),
): number | null {
  if (!isTimerColumn(ticket.column) || isTimerColumn(target)) return null;

  const sessionMs = runningSessionMs(ticket, now);
  if (sessionMs === null || sessionMs <= STALE_SESSION_THRESHOLD_MS) return null;
  return sessionMs;
}

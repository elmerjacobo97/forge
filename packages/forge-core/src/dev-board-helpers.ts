import { isTimerColumn, type ColumnId, type Ticket, type TicketSummary } from "./types.js";

export function toTicketSummary(ticket: Ticket): TicketSummary {
  return {
    id: ticket.id,
    projectId: ticket.projectId,
    title: ticket.title,
    column: ticket.column,
    priority: ticket.priority,
    branch: ticket.branch,
    prUrl: ticket.prUrl,
    createdAt: ticket.createdAt,
  };
}

export function nowISO(): string {
  return new Date().toISOString();
}

export function startTimer(ticket: Ticket): Ticket {
  if (ticket.timerStartedAt || ticket.isPaused) return ticket;
  return {
    ...ticket,
    timerStartedAt: nowISO(),
    isPaused: false,
  };
}

export function stopTimer(ticket: Ticket): Ticket {
  if (!ticket.timerStartedAt) return ticket;
  const now = Date.now();
  const additional = now - new Date(ticket.timerStartedAt).getTime();
  return {
    ...ticket,
    timerStartedAt: null,
    totalElapsedMs: ticket.totalElapsedMs + additional,
    isPaused: false,
  };
}

/** Same rule as web `positionAtEnd` (column sorted desc by position). */
export function positionAtEnd(tickets: Ticket[]): number {
  const last = tickets[tickets.length - 1];
  return last ? last.position - 1024 : 0;
}

/**
 * Move a ticket to `target` at the end of that column (append: true),
 * mirroring web `moveTicket(..., append: true)`.
 */
export function applyMoveTicket(ticket: Ticket, target: ColumnId, columnTickets: Ticket[]): Ticket {
  const targetTickets = columnTickets
    .filter((item) => item.column === target && item.id !== ticket.id)
    .slice()
    .sort((a, b) => b.position - a.position);

  let updated = ticket;
  if (isTimerColumn(target)) updated = startTimer(updated);
  if (isTimerColumn(ticket.column) && !isTimerColumn(target)) {
    updated = stopTimer(updated);
  }

  return {
    ...updated,
    column: target,
    position: positionAtEnd(targetTickets),
    lastMovedAt: ticket.column === target ? ticket.lastMovedAt : nowISO(),
  };
}

export function resolveUpdateEventType(
  previous: Ticket,
  next: Ticket,
): "completed" | "started" | "moved" | "paused" | "resumed" | null {
  const stoppedTimer = previous.timerStartedAt !== null && next.timerStartedAt === null;

  if (previous.column !== next.column) {
    if (next.column === "done") return "completed";
    if (isTimerColumn(next.column) && previous.timerStartedAt === null) {
      return "started";
    }
    return "moved";
  }

  if (stoppedTimer) return "paused";
  if (!previous.timerStartedAt && next.timerStartedAt) return "resumed";
  return null;
}

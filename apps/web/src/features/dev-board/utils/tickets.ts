import type { TicketFormValues } from "../schema";
import type { ColumnId, Ticket } from "../types";
import { nowISO, startTimer, stopTimer } from "./timer";

function positionAtEnd(tickets: Ticket[]): number {
  const last = tickets[tickets.length - 1];
  return last ? last.position - 1024 : 0;
}

function positionBefore(tickets: Ticket[], anchorId: string | null): number {
  if (!anchorId) return positionAtEnd(tickets);
  const anchorIndex = tickets.findIndex((ticket) => ticket.id === anchorId);
  if (anchorIndex === -1) return positionAtEnd(tickets);
  const before = tickets[anchorIndex - 1];
  const anchor = tickets[anchorIndex];
  return before ? (before.position + anchor.position) / 2 : anchor.position + 1024;
}

export function createTicket(values: TicketFormValues): Ticket {
  const now = nowISO();
  return {
    id: crypto.randomUUID(),
    title: values.title,
    description: values.description,
    column: "backlog",
    position: Date.now(),
    priority: values.priority,
    createdAt: now,
    timerStartedAt: null,
    totalElapsedMs: 0,
    isPaused: false,
    lastMovedAt: now,
  };
}

export function moveTicket(
  ticket: Ticket,
  target: ColumnId,
  allTickets: Ticket[],
  anchorId: string | null,
  append: boolean,
): Ticket {
  const targetTickets = allTickets
    .filter((item) => item.column === target && item.id !== ticket.id)
    .sort((a, b) => b.position - a.position);
  let updated = ticket;
  if (target === "in_progress") updated = startTimer(updated);
  if (ticket.column === "in_progress" && target !== "in_progress") updated = stopTimer(updated);

  return {
    ...updated,
    column: target,
    position: append ? positionAtEnd(targetTickets) : positionBefore(targetTickets, anchorId),
    lastMovedAt: ticket.column === target ? ticket.lastMovedAt : nowISO(),
  };
}

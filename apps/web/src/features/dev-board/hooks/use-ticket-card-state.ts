import { useSyncExternalStore } from "react";

import { useClock } from "@/lib/hooks/use-clock";

import { type Ticket, isTimerColumn } from "../types/board";
import { formatShortDateRange, isOverdue } from "../utils/planning-dates";
import { computeElapsed } from "../utils/timer";

function subscribeClientRender(): () => void {
  return () => {};
}

function getClientRenderSnapshot(): boolean {
  return true;
}

function getServerRenderSnapshot(): boolean {
  return false;
}

export function useTicketCardState(ticket: Ticket) {
  const hasMounted = useSyncExternalStore(
    subscribeClientRender,
    getClientRenderSnapshot,
    getServerRenderSnapshot,
  );

  const timerActive = isTimerColumn(ticket.column);
  const timerRunning = timerActive && ticket.timerStartedAt !== null && !ticket.isPaused;

  const now = useClock(timerRunning);
  const elapsed = now === null ? ticket.totalElapsedMs : computeElapsed(ticket, now);

  const dateRange = hasMounted ? formatShortDateRange(ticket.startDate, ticket.dueDate) : null;
  const overdue = hasMounted && isOverdue(ticket.dueDate, ticket.column === "done");
  const hasTimer = timerActive || ticket.totalElapsedMs > 0;
  const commentCount = ticket.commentCount ?? 0;
  const hasFooter = Boolean(ticket.responsibleName) || hasTimer || commentCount > 0;

  return { timerRunning, elapsed, dateRange, overdue, hasTimer, commentCount, hasFooter };
}

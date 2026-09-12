import type { Ticket } from "../types/board";
import { isTimerColumn, STALE_THRESHOLD_MS } from "../types/board";
import { formatDuration, runningSegmentMs } from "./timer";

const alertedKey = "forge_devboard:alerted";

export function loadAlertedTickets(): Set<string> {
  try {
    const raw = sessionStorage.getItem(alertedKey);
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch {
    return new Set();
  }
}

export function saveAlertedTickets(ticketIds: Set<string>): void {
  try {
    sessionStorage.setItem(alertedKey, JSON.stringify([...ticketIds]));
  } catch {
    // Session storage is optional for stale-ticket notifications.
  }
}

export function checkStaleTickets(
  tickets: Ticket[],
  alerted: Set<string>,
  now = Date.now(),
): boolean {
  let changed = false;

  tickets.forEach((ticket) => {
    if (!isTimerColumn(ticket.column) || ticket.isPaused || !ticket.timerStartedAt) {
      if (alerted.delete(ticket.id)) changed = true;
      return;
    }

    const sessionMs = runningSegmentMs(ticket, now) ?? 0;
    if (sessionMs < STALE_THRESHOLD_MS || alerted.has(ticket.id)) return;

    alerted.add(ticket.id);
    changed = true;
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("Ticket stale", {
        body: `"${ticket.title}" in progress for ${formatDuration(sessionMs)}. Update?`,
      });
    }
  });

  return changed;
}

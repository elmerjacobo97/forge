import type { TicketTimeAdjustInput } from "../schemas/ticket";
import type { TimeEntry } from "../types/analytics";
import type { Ticket } from "../types/board";
import { endTimeFromDuration, formatDuration, runningSegmentMs } from "./timer";

export type TicketTimeMode =
  { mode: "running"; startedAt: string } | { mode: "last"; entry: TimeEntry } | { mode: "total" };

export const TIME_PRESETS = [
  { label: "30m", ms: 1_800_000 },
  { label: "1h", ms: 3_600_000 },
  { label: "2h", ms: 7_200_000 },
  { label: "4h", ms: 14_400_000 },
];

export function formatClock(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function buildTimePayload(
  ticketId: string,
  target: TicketTimeMode,
  initialMs: number,
  requestedMs: number,
  remove: boolean,
): TicketTimeAdjustInput {
  if (target.mode === "running") {
    if (requestedMs > initialMs + 60_000) {
      return { ticketId, action: "stop_with_duration", durationMs: requestedMs };
    }
    return {
      ticketId,
      action: "stop_at",
      endedAt: endTimeFromDuration(target.startedAt, requestedMs),
    };
  }
  if (target.mode === "last") {
    return remove
      ? { ticketId, action: "delete_last" }
      : { ticketId, action: "set_last_duration", durationMs: requestedMs };
  }
  return { ticketId, action: "set_total", durationMs: requestedMs };
}

export function timeSessionLabel(ticket: Ticket, target: TicketTimeMode): string {
  if (target.mode === "running") {
    return `Current session started ${formatClock(target.startedAt)} · ${formatDuration(runningSegmentMs(ticket) ?? 0)} so far`;
  }
  if (target.mode === "last") {
    return `Last session: ${formatClock(target.entry.startedAt)} – ${formatClock(target.entry.endedAt)} · ${formatDuration(target.entry.durationMs)}`;
  }
  return `No sessions recorded · logged total ${formatDuration(ticket.totalElapsedMs)}`;
}

export function timePreviewLabel(
  target: TicketTimeMode,
  durationMs: number,
  extendsSession: boolean,
): string {
  if (extendsSession) {
    return `Ends now · start moves back to fit ${formatDuration(durationMs)}`;
  }
  if (target.mode === "running") {
    return `Ends at ${formatClock(endTimeFromDuration(target.startedAt, durationMs))}`;
  }
  return `New duration: ${formatDuration(durationMs)}`;
}

export function timePrimaryLabel(target: TicketTimeMode): string {
  if (target.mode === "running") return "Stop timer";
  return target.mode === "last" ? "Save" : "Set total";
}

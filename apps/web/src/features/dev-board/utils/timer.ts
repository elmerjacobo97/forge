import type { Ticket } from "../types/board";

export function nowISO(): string {
  return new Date().toISOString();
}

export function computeElapsed(ticket: Ticket, now = Date.now()): number {
  if (!ticket.timerStartedAt) return ticket.totalElapsedMs;
  return ticket.totalElapsedMs + (now - new Date(ticket.timerStartedAt).getTime());
}

export function runningSegmentMs(ticket: Ticket, now = Date.now()): number | null {
  if (!ticket.timerStartedAt) return null;
  return Math.max(0, now - new Date(ticket.timerStartedAt).getTime());
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

export function pauseTimer(ticket: Ticket): Ticket {
  const stopped = stopTimer(ticket);
  return { ...stopped, isPaused: true };
}

export function resumeTimer(ticket: Ticket): Ticket {
  if (ticket.timerStartedAt) return ticket;
  return {
    ...ticket,
    timerStartedAt: nowISO(),
    isPaused: false,
  };
}

export function formatDuration(ms: number): string {
  if (ms < 0) ms = 0;
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function durationParts(ms: number): { hours: number; minutes: number } {
  const totalMinutes = Math.round(Math.max(0, ms) / 60_000);
  return { hours: Math.floor(totalMinutes / 60), minutes: totalMinutes % 60 };
}

export function durationMsFromParts(hours: number, minutes: number): number {
  const safeHours = Math.max(0, Math.floor(hours));
  const safeMinutes = Math.max(0, Math.floor(minutes));
  return (safeHours * 60 + safeMinutes) * 60_000;
}

export function endTimeFromDuration(startedAt: string, durationMs: number): string {
  return new Date(new Date(startedAt).getTime() + Math.max(0, durationMs)).toISOString();
}

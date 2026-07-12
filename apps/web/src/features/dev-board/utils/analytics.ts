import { COLUMNS, PRIORITIES, type Ticket } from "../types/board";
import type { AnalyticsData, AnalyticsRange, AnalyticsSummary, TimeEntry } from "../types/analytics";
import { computeElapsed } from "./timer";

function dayKey(value: string): string {
  return value.slice(0, 10);
}

function clipDuration(entry: TimeEntry, range: AnalyticsRange): number {
  const start = Math.max(Date.parse(entry.startedAt), Date.parse(range.from));
  const end = Math.min(Date.parse(entry.endedAt), Date.parse(range.to));
  return Math.max(0, end - start);
}

function ticketDurations(data: AnalyticsData, range: AnalyticsRange): Map<string, number> {
  const durations = new Map<string, number>();
  data.timeEntries.forEach((entry) => {
    durations.set(entry.ticketId, (durations.get(entry.ticketId) ?? 0) + clipDuration(entry, range));
  });
  const now = Date.now();
  data.tickets.forEach((ticket) => {
    if (!ticket.timerStartedAt || ticket.isPaused) return;
    const activeEntry: TimeEntry = {
      id: ticket.id,
      ticketId: ticket.id,
      startedAt: ticket.timerStartedAt,
      endedAt: new Date(now).toISOString(),
      durationMs: computeElapsed(ticket, now),
    };
    durations.set(ticket.id, (durations.get(ticket.id) ?? 0) + clipDuration(activeEntry, range));
  });
  return durations;
}

export function presetRange(preset: Exclude<import("../types/analytics").AnalyticsPreset, "custom">): AnalyticsRange {
  const days = preset === "7d" ? 7 : preset === "30d" ? 30 : 90;
  const to = new Date();
  const from = new Date(to);
  from.setDate(from.getDate() - (days - 1));
  from.setHours(0, 0, 0, 0);
  return { from: from.toISOString(), to: to.toISOString() };
}

export function buildAnalytics(data: AnalyticsData, range: AnalyticsRange): AnalyticsSummary {
  const durations = ticketDurations(data, range);
  const byTicket = new Map(data.tickets.map((ticket) => [ticket.id, ticket]));
  const completedEvents = data.events.filter((event) => event.eventType === "completed");
  const throughputMap = new Map<string, number>();
  completedEvents.forEach((event) => {
    const key = dayKey(event.occurredAt);
    throughputMap.set(key, (throughputMap.get(key) ?? 0) + 1);
  });
  const loggedTimeMap = new Map<string, number>();
  data.timeEntries.forEach((entry) => {
    const key = dayKey(entry.endedAt);
    loggedTimeMap.set(key, (loggedTimeMap.get(key) ?? 0) + clipDuration(entry, range));
  });
  const cycles = completedEvents.flatMap((event) => {
    const started = data.events.find(
      (candidate) => candidate.ticketId === event.ticketId && candidate.eventType === "started",
    );
    return started ? [Math.max(0, Date.parse(event.occurredAt) - Date.parse(started.occurredAt))] : [];
  });
  const topTickets = [...durations.entries()]
    .map(([ticketId, durationMs]) => ({ ticket: byTicket.get(ticketId), durationMs }))
    .filter((item): item is { ticket: Ticket; durationMs: number } => Boolean(item.ticket))
    .sort((a, b) => b.durationMs - a.durationMs)
    .slice(0, 5);
  const loggedMs = [...durations.values()].reduce((total, duration) => total + duration, 0);

  return {
    completed: completedEvents.length,
    loggedMs,
    averageCycleMs: cycles.length ? cycles.reduce((total, value) => total + value, 0) / cycles.length : null,
    active: data.tickets.filter((ticket) => ticket.column === "in_progress" && !ticket.isPaused).length,
    paused: data.tickets.filter((ticket) => ticket.column === "in_progress" && ticket.isPaused).length,
    longestTicket: topTickets[0] ? { title: topTickets[0].ticket.title, durationMs: topTickets[0].durationMs } : null,
    throughput: [...throughputMap.entries()].map(([date, completed]) => ({ date, completed })).sort((a, b) => a.date.localeCompare(b.date)),
    loggedTime: [...loggedTimeMap.entries()].map(([date, durationMs]) => ({ date, durationMs })).sort((a, b) => a.date.localeCompare(b.date)),
    status: COLUMNS.map((column) => ({ column, count: data.tickets.filter((ticket) => ticket.column === column).length })),
    priority: PRIORITIES.map((priority) => ({
      priority,
      durationMs: data.tickets.filter((ticket) => ticket.priority === priority).reduce((total, ticket) => total + (durations.get(ticket.id) ?? 0), 0),
    })),
    topTickets,
  };
}

export function analyticsCsv(summary: AnalyticsSummary): string {
  const escape = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;
  return [
    ["Ticket", "Column", "Priority", "Time logged (minutes)"],
    ...summary.topTickets.map(({ ticket, durationMs }) => [ticket.title, ticket.column, ticket.priority, Math.round(durationMs / 60_000)]),
  ]
    .map((row) => row.map(escape).join(","))
    .join("\n");
}

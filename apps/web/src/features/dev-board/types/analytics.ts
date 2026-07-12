import type { ColumnId, Priority, Ticket } from "./board";

export type AnalyticsPreset = "7d" | "30d" | "90d" | "custom";

export interface AnalyticsRange {
  from: string;
  to: string;
}

export interface TicketEvent {
  id: string;
  ticketId: string;
  eventType: "created" | "moved" | "started" | "completed" | "paused" | "resumed";
  fromColumn: ColumnId | null;
  toColumn: ColumnId | null;
  occurredAt: string;
}

export interface TimeEntry {
  id: string;
  ticketId: string;
  startedAt: string;
  endedAt: string;
  durationMs: number;
}

export interface AnalyticsData {
  tickets: Ticket[];
  events: TicketEvent[];
  timeEntries: TimeEntry[];
}

export interface AnalyticsSummary {
  completed: number;
  loggedMs: number;
  averageCycleMs: number | null;
  active: number;
  paused: number;
  longestTicket: { title: string; durationMs: number } | null;
  throughput: { date: string; completed: number }[];
  loggedTime: { date: string; durationMs: number }[];
  status: { column: ColumnId; count: number }[];
  priority: { priority: Priority; durationMs: number }[];
  topTickets: { ticket: Ticket; durationMs: number }[];
}

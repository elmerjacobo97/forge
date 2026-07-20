import { z } from "zod";

import { insforge } from "@/lib/insforge/browser";
import type { AnalyticsData, AnalyticsRange } from "../types/analytics";
import { COLUMNS, type Ticket } from "../types/board";
import { devBoardService } from "./dev-board-service";

const eventRowSchema = z.object({
  id: z.string(),
  ticket_id: z.string(),
  event_type: z.enum(["created", "moved", "started", "completed", "paused", "resumed"]),
  from_column: z.enum(["backlog", "todo", "in_progress", "review", "done"]).nullable(),
  to_column: z.enum(["backlog", "todo", "in_progress", "review", "done"]).nullable(),
  occurred_at: z.string(),
});

const timeEntryRowSchema = z.object({
  id: z.string(),
  ticket_id: z.string(),
  started_at: z.string(),
  ended_at: z.string(),
  duration_ms: z.coerce.number(),
});

function failure(error: { message?: string } | null, fallback: string): Error {
  return new Error(error?.message || fallback);
}

export const devBoardAnalyticsService = {
  async fetchAnalytics(
    userId: string,
    projectId: string,
    range: AnalyticsRange,
  ): Promise<AnalyticsData> {
    const ticketPages = await Promise.all(
      COLUMNS.map(async (column) => {
        const tickets: Ticket[] = [];
        let cursor: string | null = null;
        do {
          const page = await devBoardService.fetchTicketPage(userId, projectId, column, cursor);
          tickets.push(...page.tickets);
          cursor = page.nextCursor;
        } while (cursor);
        return tickets;
      }),
    );
    const tickets = ticketPages.flat();
    const ticketIds = tickets.map((ticket) => ticket.id);
    if (ticketIds.length === 0) return { tickets, events: [], timeEntries: [] };

    const [eventsResult, timeEntriesResult] = await Promise.all([
      insforge.database
        .from("dev_board_events")
        .select("id,ticket_id,event_type,from_column,to_column,occurred_at")
        .in("ticket_id", ticketIds)
        .gte("occurred_at", range.from)
        .lte("occurred_at", range.to)
        .order("occurred_at", { ascending: false }),
      insforge.database
        .from("dev_board_time_entries")
        .select("id,ticket_id,started_at,ended_at,duration_ms")
        .in("ticket_id", ticketIds)
        .lte("started_at", range.to)
        .order("started_at", { ascending: false }),
    ]);

    if (eventsResult.error) throw failure(eventsResult.error, "Failed to load ticket events.");
    if (timeEntriesResult.error) {
      throw failure(timeEntriesResult.error, "Failed to load time entries.");
    }

    const events = eventRowSchema.array().parse(eventsResult.data).map((row) => ({
      id: row.id,
      ticketId: row.ticket_id,
      eventType: row.event_type,
      fromColumn: row.from_column,
      toColumn: row.to_column,
      occurredAt: row.occurred_at,
    }));
    const timeEntries = timeEntryRowSchema.array().parse(timeEntriesResult.data).map((row) => ({
      id: row.id,
      ticketId: row.ticket_id,
      startedAt: row.started_at,
      endedAt: row.ended_at,
      durationMs: row.duration_ms,
    }));

    return { tickets, events, timeEntries };
  },
};

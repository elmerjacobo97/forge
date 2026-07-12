import { Query } from "appwrite";

import { tablesDB } from "@/lib/appwrite";

import type { AnalyticsData, AnalyticsRange, TicketEvent } from "../types/analytics";
import { COLUMNS, type Ticket } from "../types/board";
import { devBoardService } from "./dev-board-service";

const databaseId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const eventsTableId = import.meta.env.VITE_APPWRITE_DEV_BOARD_EVENTS_TABLE_ID;
const timeEntriesTableId = import.meta.env.VITE_APPWRITE_DEV_BOARD_TIME_ENTRIES_TABLE_ID;

function assertConfigured(): void {
  if (!databaseId || !eventsTableId || !timeEntriesTableId) {
    throw new Error("Dev Board analytics storage is not configured.");
  }
}

async function listAllRows(tableId: string, queries: string[]) {
  const rows: Record<string, unknown>[] = [];
  let cursor: string | null = null;
  do {
    const response: { rows: Array<{ $id: string }>; total: number } = (await tablesDB.listRows({
      databaseId,
      tableId,
      queries: [...queries, Query.limit(100), ...(cursor ? [Query.cursorAfter(cursor)] : [])],
    })) as unknown as { rows: Array<{ $id: string }>; total: number };
    rows.push(...(response.rows as unknown as Record<string, unknown>[]));
    cursor = response.rows.length === 100 ? response.rows[response.rows.length - 1].$id : null;
  } while (cursor);
  return rows;
}

export const devBoardAnalyticsService = {
  async fetchAnalytics(userId: string, range: AnalyticsRange): Promise<AnalyticsData> {
    assertConfigured();
    const ticketPages = await Promise.all(
      COLUMNS.map(async (column) => {
        const tickets: Ticket[] = [];
        let cursor: string | null = null;
        do {
          const page = await devBoardService.fetchTicketPage(userId, column, cursor);
          tickets.push(...page.tickets);
          cursor = page.nextCursor;
        } while (cursor);
        return tickets;
      }),
    );
    const [eventRows, timeRows] = await Promise.all([
      listAllRows(eventsTableId, [
        Query.equal("userId", userId),
        Query.greaterThanEqual("occurredAt", range.from),
        Query.lessThanEqual("occurredAt", range.to),
        Query.orderDesc("occurredAt"),
      ]),
      listAllRows(timeEntriesTableId, [
        Query.equal("userId", userId),
        Query.lessThanEqual("startedAt", range.to),
        Query.orderDesc("startedAt"),
      ]),
    ]);

    return {
      tickets: ticketPages.flat(),
      events: eventRows.map((row) => ({
        id: String(row.$id),
        ticketId: String(row.ticketId),
        eventType: row.eventType as TicketEvent["eventType"],
        fromColumn: (row.fromColumn as TicketEvent["fromColumn"]) ?? null,
        toColumn: (row.toColumn as TicketEvent["toColumn"]) ?? null,
        occurredAt: String(row.occurredAt),
      })),
      timeEntries: timeRows.map((row) => ({
        id: String(row.$id),
        ticketId: String(row.ticketId),
        startedAt: String(row.startedAt),
        endedAt: String(row.endedAt),
        durationMs: Number(row.durationMs),
      })),
    };
  },
};

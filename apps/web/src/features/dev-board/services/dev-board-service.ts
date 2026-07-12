import { ID, Permission, Query, Role } from "appwrite";

import { tablesDB } from "@/lib/appwrite";

import { type ColumnId, type Ticket, TICKETS_PAGE_SIZE } from "../types/board";

const databaseId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const tableId = import.meta.env.VITE_APPWRITE_DEV_BOARD_TICKETS_TABLE_ID;
const eventsTableId = import.meta.env.VITE_APPWRITE_DEV_BOARD_EVENTS_TABLE_ID;
const timeEntriesTableId = import.meta.env.VITE_APPWRITE_DEV_BOARD_TIME_ENTRIES_TABLE_ID;

interface TicketRow {
  $id: string;
  $createdAt: string;
  title: string;
  description: string;
  column: ColumnId;
  position: number;
  priority: Ticket["priority"];
  totalElapsedMs: number;
  timerStartedAt: string | null;
  isPaused: boolean;
  lastMovedAt: string;
}

export interface TicketPage {
  tickets: Ticket[];
  nextCursor: string | null;
  total: number;
}

function assertConfigured(): void {
  if (!databaseId || !tableId || !eventsTableId || !timeEntriesTableId) {
    throw new Error("Dev Board storage is not configured.");
  }
}

function privatePermissions(userId: string) {
  return [
    Permission.read(Role.user(userId)),
    Permission.update(Role.user(userId)),
    Permission.delete(Role.user(userId)),
  ];
}

async function commitTransaction(operation: (transactionId: string) => Promise<void>): Promise<void> {
  const transaction = await tablesDB.createTransaction({});
  try {
    await operation(transaction.$id);
    await tablesDB.updateTransaction({ transactionId: transaction.$id, commit: true });
  } catch (error) {
    await tablesDB.updateTransaction({ transactionId: transaction.$id, rollback: true });
    throw error;
  }
}

function eventData(ticket: Ticket, userId: string, eventType: string, fromColumn?: ColumnId) {
  return {
    userId,
    ticketId: ticket.id,
    eventType,
    fromColumn,
    toColumn: ticket.column,
    occurredAt: ticket.lastMovedAt,
  };
}

function toTicket(row: TicketRow): Ticket {
  return {
    id: row.$id,
    title: row.title,
    description: row.description,
    column: row.column,
    position: row.position,
    priority: row.priority,
    createdAt: row.$createdAt,
    timerStartedAt: row.timerStartedAt,
    totalElapsedMs: row.totalElapsedMs,
    isPaused: row.isPaused,
    lastMovedAt: row.lastMovedAt,
  };
}

function ticketData(ticket: Ticket, userId: string) {
  return {
    userId,
    title: ticket.title,
    description: ticket.description,
    column: ticket.column,
    position: ticket.position,
    priority: ticket.priority,
    totalElapsedMs: ticket.totalElapsedMs,
    timerStartedAt: ticket.timerStartedAt,
    isPaused: ticket.isPaused,
    lastMovedAt: ticket.lastMovedAt,
  };
}

export const devBoardService = {
  async fetchTicketPage(userId: string, column: ColumnId, cursor: string | null): Promise<TicketPage> {
    assertConfigured();
    const queries = [
      Query.equal("userId", userId),
      Query.equal("column", column),
      Query.orderDesc("position"),
      Query.limit(TICKETS_PAGE_SIZE),
    ];
    if (cursor) queries.push(Query.cursorAfter(cursor));

    const response = await tablesDB.listRows({
      databaseId,
      tableId,
      queries,
    });
    const rows = response.rows as unknown as TicketRow[];
    const lastRow = rows[rows.length - 1];

    return {
      tickets: rows.map(toTicket),
      nextCursor: rows.length === TICKETS_PAGE_SIZE && lastRow ? lastRow.$id : null,
      total: response.total,
    };
  },

  async createTicket(ticket: Ticket, userId: string): Promise<Ticket> {
    assertConfigured();
    await commitTransaction(async (transactionId) => {
      await tablesDB.createRow({
        databaseId,
        tableId,
        rowId: ticket.id || ID.unique(),
        data: ticketData(ticket, userId),
        permissions: privatePermissions(userId),
        transactionId,
      });
      await tablesDB.createRow({
        databaseId,
        tableId: eventsTableId,
        rowId: ID.unique(),
        data: eventData(ticket, userId, "created"),
        permissions: privatePermissions(userId),
        transactionId,
      });
    });
    return ticket;
  },

  async updateTicket(ticket: Ticket, userId: string): Promise<Ticket> {
    assertConfigured();
    const previous = toTicket(
      (await tablesDB.getRow({ databaseId, tableId, rowId: ticket.id })) as unknown as TicketRow,
    );
    const timerStartedAt = previous.timerStartedAt;
    const stoppedTimer = timerStartedAt !== null && !ticket.timerStartedAt;
    const eventType =
      previous.column !== ticket.column
        ? ticket.column === "done"
          ? "completed"
          : ticket.column === "in_progress"
            ? "started"
            : "moved"
        : stoppedTimer
          ? "paused"
          : !previous.timerStartedAt && ticket.timerStartedAt
            ? "resumed"
            : null;

    await commitTransaction(async (transactionId) => {
      await tablesDB.updateRow({
        databaseId,
        tableId,
        rowId: ticket.id,
        data: ticketData(ticket, userId),
        transactionId,
      });
      if (eventType) {
        await tablesDB.createRow({
          databaseId,
          tableId: eventsTableId,
          rowId: ID.unique(),
          data: eventData(ticket, userId, eventType, previous.column),
          permissions: privatePermissions(userId),
          transactionId,
        });
      }
      if (stoppedTimer) {
        const endedAt = new Date().toISOString();
        await tablesDB.createRow({
          databaseId,
          tableId: timeEntriesTableId,
          rowId: ID.unique(),
          data: {
            userId,
            ticketId: ticket.id,
            startedAt: timerStartedAt,
            endedAt,
            durationMs: Math.max(0, Date.parse(endedAt) - Date.parse(timerStartedAt)),
          },
          permissions: privatePermissions(userId),
          transactionId,
        });
      }
    });
    return ticket;
  },

  async deleteTicket(ticketId: string): Promise<void> {
    assertConfigured();
    await tablesDB.deleteRow({ databaseId, tableId, rowId: ticketId });
  },
};

import { ID, Permission, Query, Role } from "appwrite";

import { tablesDB } from "@/lib/appwrite";

import { type ColumnId, type Ticket, TICKETS_PAGE_SIZE } from "../types";

const databaseId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const tableId = import.meta.env.VITE_APPWRITE_DEV_BOARD_TICKETS_TABLE_ID;

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
  if (!databaseId || !tableId) {
    throw new Error("Dev Board storage is not configured.");
  }
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
    const row = await tablesDB.createRow({
      databaseId,
      tableId,
      rowId: ticket.id || ID.unique(),
      data: ticketData(ticket, userId),
      permissions: [
        Permission.read(Role.user(userId)),
        Permission.update(Role.user(userId)),
        Permission.delete(Role.user(userId)),
      ],
    });
    return toTicket(row as unknown as TicketRow);
  },

  async updateTicket(ticket: Ticket, userId: string): Promise<Ticket> {
    assertConfigured();
    const row = await tablesDB.updateRow({
      databaseId,
      tableId,
      rowId: ticket.id,
      data: ticketData(ticket, userId),
    });
    return toTicket(row as unknown as TicketRow);
  },

  async deleteTicket(ticketId: string): Promise<void> {
    assertConfigured();
    await tablesDB.deleteRow({ databaseId, tableId, rowId: ticketId });
  },
};

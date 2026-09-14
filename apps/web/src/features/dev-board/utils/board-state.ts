import { COLUMNS, type ColumnId, type ColumnPage, type Ticket } from "../types/board";
import type { TicketChange } from "./board-realtime";

export type ColumnRecord = Record<ColumnId, ColumnPage>;

export function toColumnRecord(pages: ColumnPage[]): ColumnRecord {
  const byColumn = new Map(pages.map((page) => [page.column, page]));
  const record = {} as ColumnRecord;

  for (const column of COLUMNS) {
    record[column] = byColumn.get(column) ?? { column, tickets: [], total: 0, nextCursor: null };
  }

  return record;
}

export function columnTickets(columns: ColumnRecord): Ticket[] {
  return COLUMNS.flatMap((column) => columns[column].tickets).sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
}

function sortTickets(tickets: Ticket[]): Ticket[] {
  return [...tickets].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function upsertTicket(columns: ColumnRecord, ticket: Ticket): ColumnRecord {
  const existing =
    ticket.commentCount === undefined
      ? COLUMNS.flatMap((column) => columns[column].tickets).find((item) => item.id === ticket.id)
      : undefined;
  const incoming =
    existing?.commentCount === undefined
      ? ticket
      : { ...ticket, commentCount: existing.commentCount };
  const next = {} as ColumnRecord;

  for (const column of COLUMNS) {
    const page = columns[column];
    const withoutTicket = page.tickets.filter((item) => item.id !== incoming.id);

    if (column !== incoming.column) {
      next[column] =
        withoutTicket.length === page.tickets.length
          ? page
          : { ...page, tickets: withoutTicket, total: Math.max(0, page.total - 1) };
      continue;
    }

    const existed = withoutTicket.length !== page.tickets.length;
    next[column] = {
      ...page,
      tickets: sortTickets([...withoutTicket, incoming]),
      total: existed ? page.total : page.total + 1,
    };
  }

  return next;
}

export function incrementCommentCount(columns: ColumnRecord, ticketId: string): ColumnRecord {
  const next = {} as ColumnRecord;

  for (const column of COLUMNS) {
    const page = columns[column];
    const hasTicket = page.tickets.some((ticket) => ticket.id === ticketId);

    if (!hasTicket) {
      next[column] = page;
      continue;
    }

    next[column] = {
      ...page,
      tickets: page.tickets.map((ticket) =>
        ticket.id === ticketId
          ? { ...ticket, commentCount: (ticket.commentCount ?? 0) + 1 }
          : ticket,
      ),
    };
  }

  return next;
}

export function removeTicket(columns: ColumnRecord, ticket: Ticket): ColumnRecord {
  const next = {} as ColumnRecord;

  for (const column of COLUMNS) {
    const page = columns[column];
    if (column !== ticket.column) {
      next[column] = page;
      continue;
    }

    next[column] = {
      ...page,
      tickets: page.tickets.filter((item) => item.id !== ticket.id),
      total: Math.max(0, page.total - 1),
    };
  }

  return next;
}

export function appendTickets(
  columns: ColumnRecord,
  column: ColumnId,
  tickets: Ticket[],
  nextCursor: string | null,
  total: number,
): ColumnRecord {
  const page = columns[column];
  const knownIds = new Set(page.tickets.map((ticket) => ticket.id));
  const fresh = tickets.filter((ticket) => !knownIds.has(ticket.id));

  return {
    ...columns,
    [column]: {
      ...page,
      tickets: [...page.tickets, ...fresh],
      nextCursor,
      total,
    },
  };
}

function findTicketColumn(columns: ColumnRecord, ticketId: string): ColumnId | null {
  for (const column of COLUMNS) {
    if (columns[column].tickets.some((ticket) => ticket.id === ticketId)) return column;
  }

  return null;
}

function withColumnTotal(columns: ColumnRecord, column: ColumnId, delta: number): ColumnRecord {
  const page = columns[column];
  return {
    ...columns,
    [column]: { ...page, total: Math.max(0, page.total + delta) },
  };
}

/**
 * Applies a realtime ticket event on top of the columns loaded in the board.
 * Tickets outside the loaded pages still adjust the affected column totals.
 */
export function applyRealtimeTicket(columns: ColumnRecord, change: TicketChange): ColumnRecord {
  const { action, ticket, fromColumn } = change;

  if (action === "delete") {
    if (findTicketColumn(columns, ticket.id) !== null) return removeTicket(columns, ticket);
    return withColumnTotal(columns, ticket.column, -1);
  }

  const previousColumn = findTicketColumn(columns, ticket.id);
  const next = upsertTicket(columns, ticket);

  if (previousColumn === null && fromColumn !== null && fromColumn !== ticket.column) {
    return withColumnTotal(next, fromColumn, -1);
  }

  return next;
}

import { COLUMNS, type ColumnId, type ColumnPage, type Ticket } from "../types/board";

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

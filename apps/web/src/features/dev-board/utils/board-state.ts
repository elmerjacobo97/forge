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
  return COLUMNS.flatMap((column) => columns[column].tickets).sort(
    (a, b) => b.position - a.position,
  );
}

function sortTickets(tickets: Ticket[]): Ticket[] {
  return [...tickets].sort((a, b) => b.position - a.position);
}

export function upsertTicket(columns: ColumnRecord, ticket: Ticket): ColumnRecord {
  const next = {} as ColumnRecord;

  for (const column of COLUMNS) {
    const page = columns[column];
    const withoutTicket = page.tickets.filter((item) => item.id !== ticket.id);

    if (column !== ticket.column) {
      next[column] =
        withoutTicket.length === page.tickets.length
          ? page
          : { ...page, tickets: withoutTicket, total: Math.max(0, page.total - 1) };
      continue;
    }

    const existed = withoutTicket.length !== page.tickets.length;
    next[column] = {
      ...page,
      tickets: sortTickets([...withoutTicket, ticket]),
      total: existed ? page.total : page.total + 1,
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

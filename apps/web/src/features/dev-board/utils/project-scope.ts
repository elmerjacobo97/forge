export function ticketIdSet(tickets: ReadonlyArray<{ id: string }>): Set<string> {
  return new Set(tickets.map((ticket) => ticket.id));
}

export function filterRowsForTickets<T extends { ticketId: string }>(
  rows: ReadonlyArray<T>,
  ticketIds: ReadonlySet<string>,
): T[] {
  return rows.filter((row) => ticketIds.has(row.ticketId));
}

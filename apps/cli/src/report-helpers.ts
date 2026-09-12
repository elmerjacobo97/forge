import type { ActivityTicket, ColumnId, Ticket, TicketComment, TicketEvent } from "./types.js";

const DAY_MS = 24 * 60 * 60 * 1000;

export type ReportWindow = {
  from: string;
  to: string;
  days: number;
};

export function resolveReportWindow(input: {
  days: number;
  since?: string;
  until?: string;
  now?: Date;
}): ReportWindow {
  const now = input.now ?? new Date();
  const to = input.until ? new Date(input.until) : now;
  const from = input.since ? new Date(input.since) : new Date(to.getTime() - input.days * DAY_MS);
  const days = input.since
    ? Math.max(1, Math.round((to.getTime() - from.getTime()) / DAY_MS))
    : input.days;
  return { from: from.toISOString(), to: to.toISOString(), days };
}

export type GroupActivityInput = {
  tickets: Ticket[];
  projects: Array<{ id: string; name: string }>;
  events: TicketEvent[];
  comments: TicketComment[];
  columns?: ColumnId[];
};

function groupByTicketId<T extends { ticketId: string }>(items: T[]): Map<string, T[]> {
  const grouped = new Map<string, T[]>();
  for (const item of items) {
    const list = grouped.get(item.ticketId);
    if (list) list.push(item);
    else grouped.set(item.ticketId, [item]);
  }
  return grouped;
}

function latestActivityAt(entry: ActivityTicket): number {
  const times = [
    ...entry.events.map((event) => Date.parse(event.occurredAt)),
    ...entry.comments.map((comment) => Date.parse(comment.createdAt)),
  ];
  return times.length > 0 ? Math.max(...times) : 0;
}

/**
 * Group in-window events/comments per ticket. Tickets without activity are
 * omitted, tickets currently in `backlog` are always excluded (creating a
 * backlog ticket is not work), and `columns` narrows by current column.
 */
export function groupActivity(input: GroupActivityInput): ActivityTicket[] {
  const projectsById = new Map(input.projects.map((project) => [project.id, project]));
  const ticketsById = new Map(input.tickets.map((ticket) => [ticket.id, ticket]));
  const eventsByTicket = groupByTicketId(
    input.events.filter((event) => ticketsById.has(event.ticketId)),
  );
  const commentsByTicket = groupByTicketId(
    input.comments.filter((comment) => ticketsById.has(comment.ticketId)),
  );
  const columnFilter =
    input.columns && input.columns.length > 0 ? new Set<ColumnId>(input.columns) : null;

  const ticketIds = new Set([...eventsByTicket.keys(), ...commentsByTicket.keys()]);
  const groups: ActivityTicket[] = [];

  for (const ticketId of ticketIds) {
    const ticket = ticketsById.get(ticketId);
    if (!ticket) continue;
    if (ticket.column === "backlog") continue;
    if (columnFilter && !columnFilter.has(ticket.column)) continue;

    const project = projectsById.get(ticket.projectId);
    groups.push({
      ticket,
      project: project ? { id: project.id, name: project.name } : null,
      events: (eventsByTicket.get(ticketId) ?? [])
        .slice()
        .sort((a, b) => a.occurredAt.localeCompare(b.occurredAt)),
      comments: (commentsByTicket.get(ticketId) ?? [])
        .slice()
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    });
  }

  return groups.sort((a, b) => {
    const byActivity = latestActivityAt(b) - latestActivityAt(a);
    if (byActivity !== 0) return byActivity;
    return a.ticket.id.localeCompare(b.ticket.id);
  });
}

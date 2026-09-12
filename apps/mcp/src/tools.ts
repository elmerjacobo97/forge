import { groupActivity, resolveReportWindow, toTicketSummary } from "@forge/core";
import type {
  ActivityReport,
  ColumnId,
  NextTicketContext,
  Project,
  Ticket,
  TicketComment,
} from "@forge/core";
import type { ForgeServices } from "./services.js";

export interface TicketReportArgs {
  days: number;
  since?: string;
  until?: string;
  projectId?: string;
  columns?: ColumnId[];
}

export function createToolHandlers(services: ForgeServices) {
  async function activityReport(input: TicketReportArgs): Promise<ActivityReport> {
    const window = resolveReportWindow({
      days: input.days,
      since: input.since,
      until: input.until,
    });

    const projects = input.projectId
      ? [await services.projects.get(input.projectId)]
      : await services.projects.list();

    const tickets: Ticket[] = [];
    for (const project of projects) {
      tickets.push(...(await services.board.list(project.id)));
    }

    const [events, comments] = await Promise.all([
      services.activity.listEvents(window.from, window.to),
      services.activity.listCommentsInRange(window.from, window.to),
    ]);

    return {
      ...window,
      tickets: groupActivity({ tickets, projects, events, comments, columns: input.columns }),
    };
  }

  return {
    listProjects: (): Promise<Project[]> => services.projects.list(),

    getProject: ({ projectId }: { projectId: string }): Promise<Project> =>
      services.projects.get(projectId),

    listTickets: async ({ projectId, column }: { projectId: string; column?: ColumnId }) =>
      (await services.board.list(projectId, column)).map(toTicketSummary),

    nextTicket: ({ projectId }: { projectId?: string } = {}): Promise<NextTicketContext> =>
      services.board.next({ projectId }),

    getTicket: async ({
      ticketId,
    }: {
      ticketId: string;
    }): Promise<{ ticket: Ticket; comments: TicketComment[] }> => ({
      ticket: await services.board.get(ticketId),
      comments: await services.board.listComments(ticketId),
    }),

    activityReport,
  };
}

export type ToolHandlers = ReturnType<typeof createToolHandlers>;

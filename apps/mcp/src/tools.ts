import { groupActivity, resolveReportWindow, toTicketSummary } from "@forge/core";
import type {
  ActivityReport,
  ColumnId,
  NextTicketContext,
  Project,
  Ticket,
  TicketComment,
  TicketCreateInput,
  TicketUpdateInput,
} from "@forge/core";
import type { ForgeServices } from "./services.js";

export interface TicketReportArgs {
  days: number;
  since?: string;
  until?: string;
  projectId?: string;
  columns?: ColumnId[];
}

type TicketHandoffFields = Pick<
  TicketUpdateInput,
  "branch" | "prUrl" | "clearBranch" | "clearPrUrl" | "responsibleName" | "clearResponsible"
>;
type TicketUpdateFields = TicketHandoffFields &
  Pick<
    TicketUpdateInput,
    "startDate" | "dueDate" | "complexity" | "clearStartDate" | "clearDueDate" | "clearComplexity"
  >;

function ticketUpdateFields(input: TicketUpdateFields): TicketUpdateInput {
  return {
    ...(input.branch !== undefined ? { branch: input.branch } : {}),
    ...(input.prUrl !== undefined ? { prUrl: input.prUrl } : {}),
    ...(input.clearBranch !== undefined ? { clearBranch: input.clearBranch } : {}),
    ...(input.clearPrUrl !== undefined ? { clearPrUrl: input.clearPrUrl } : {}),
    ...(input.responsibleName !== undefined ? { responsibleName: input.responsibleName } : {}),
    ...(input.clearResponsible !== undefined ? { clearResponsible: input.clearResponsible } : {}),
    ...(input.startDate !== undefined ? { startDate: input.startDate } : {}),
    ...(input.dueDate !== undefined ? { dueDate: input.dueDate } : {}),
    ...(input.complexity !== undefined ? { complexity: input.complexity } : {}),
    ...(input.clearStartDate !== undefined ? { clearStartDate: input.clearStartDate } : {}),
    ...(input.clearDueDate !== undefined ? { clearDueDate: input.clearDueDate } : {}),
    ...(input.clearComplexity !== undefined ? { clearComplexity: input.clearComplexity } : {}),
  };
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

    createTicket: async (input: TicketCreateInput): Promise<Ticket> => {
      await services.projects.get(input.projectId);
      return services.board.create(input);
    },

    moveTicket: (
      input: { ticketId: string; column: ColumnId } & TicketHandoffFields,
    ): Promise<Ticket> =>
      services.board.move({
        id: input.ticketId,
        column: input.column,
        ...ticketUpdateFields(input),
      }),

    updateTicket: ({
      ticketId,
      ...fields
    }: { ticketId: string } & TicketUpdateFields): Promise<Ticket> =>
      services.board.update(ticketId, ticketUpdateFields(fields)),

    addTicketComment: ({
      ticketId,
      body,
    }: {
      ticketId: string;
      body: string;
    }): Promise<TicketComment> => services.board.addComment(ticketId, body, "agent"),

    pauseTicket: ({ ticketId }: { ticketId: string }): Promise<Ticket> =>
      services.board.pauseTimer(ticketId),

    resumeTicket: ({ ticketId }: { ticketId: string }): Promise<Ticket> =>
      services.board.resumeTimer(ticketId),
  };
}

export type ToolHandlers = ReturnType<typeof createToolHandlers>;

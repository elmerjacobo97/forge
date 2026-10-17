import {
  groupActivity,
  parseTicketTimeAdjustInput,
  projectForgeUrl,
  resolveReportWindow,
  resourceForgeUrl,
  ticketForgeUrl,
  toTicketSummary,
} from "@forge/core";
import type {
  ActivityReport,
  ColumnId,
  NextTicketContext,
  Note,
  NoteCreateInput,
  NoteListOptions,
  NoteUpdateInput,
  Project,
  ProjectCreateInput,
  ProjectFlow,
  ProjectFlowUpsertInput,
  ProjectMap,
  ProjectModule,
  ProjectModuleUpsertInput,
  Resource,
  ResourceCategory,
  ResourceCreateInput,
  ResourceUpdateInput,
  Ticket,
  TicketComment,
  TicketCreateInput,
  TicketUpdateInput,
} from "@forge/core";
import type { ForgeServices } from "./services.js";

type WithForgeUrl<T> = T & { forgeUrl: string };

const withProjectUrl = (project: Project): WithForgeUrl<Project> => ({
  ...project,
  forgeUrl: projectForgeUrl(project),
});

const withTicketUrl = (ticket: Ticket): WithForgeUrl<Ticket> => ({
  ...ticket,
  forgeUrl: ticketForgeUrl(ticket),
});

const withResourceUrl = (resource: Resource): WithForgeUrl<Resource> => ({
  ...resource,
  forgeUrl: resourceForgeUrl(resource),
});

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

export interface ResourceListArgs {
  limit?: number;
  offset?: number;
  category?: ResourceCategory;
}

export type ResourceUpdateArgs = Partial<ResourceCreateInput> & {
  resourceId: string;
  addTags?: string[];
  removeTags?: string[];
};

export type NoteUpdateArgs = NoteUpdateInput & {
  noteId: string;
  addTags?: string[];
  removeTags?: string[];
};

export function createToolHandlers(services: ForgeServices) {
  async function updateNote({
    noteId,
    addTags,
    removeTags,
    ...fields
  }: NoteUpdateArgs): Promise<Note> {
    if (addTags === undefined && removeTags === undefined) {
      return services.notes.update(noteId, fields);
    }

    const current = await services.notes.get(noteId);
    const tags = new Set([...current.tags, ...(addTags ?? [])]);
    for (const tag of removeTags ?? []) tags.delete(tag);
    return services.notes.update(noteId, { ...fields, tags: [...tags] });
  }

  async function updateResource({
    resourceId,
    addTags,
    removeTags,
    ...fields
  }: ResourceUpdateArgs): Promise<WithForgeUrl<Resource>> {
    const update: ResourceUpdateInput = fields;
    if (addTags === undefined && removeTags === undefined) {
      return withResourceUrl(await services.resources.update(resourceId, update));
    }

    const current = await services.resources.get(resourceId);
    const tags = new Set([...current.tags, ...(addTags ?? [])]);
    for (const tag of removeTags ?? []) tags.delete(tag);
    return withResourceUrl(
      await services.resources.update(resourceId, { ...update, tags: [...tags] }),
    );
  }

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

    getProject: async ({ projectId }: { projectId: string }): Promise<WithForgeUrl<Project>> =>
      withProjectUrl(await services.projects.get(projectId)),

    createProject: async (input: ProjectCreateInput): Promise<WithForgeUrl<Project>> =>
      withProjectUrl(await services.projects.create(input)),

    deleteProject: async ({ projectId }: { projectId: string }): Promise<{ id: string }> => {
      await services.projects.delete(projectId);
      return { id: projectId };
    },

    listTickets: async ({ projectId, column }: { projectId: string; column?: ColumnId }) =>
      (await services.board.list(projectId, column)).map(toTicketSummary),

    nextTicket: ({ projectId }: { projectId?: string } = {}): Promise<NextTicketContext> =>
      services.board.next({ projectId }),

    getTicket: async ({
      ticketId,
    }: {
      ticketId: string;
    }): Promise<{ ticket: WithForgeUrl<Ticket>; comments: TicketComment[] }> => ({
      ticket: withTicketUrl(await services.board.get(ticketId)),
      comments: await services.board.listComments(ticketId),
    }),

    activityReport,

    listResources: (args: ResourceListArgs): Promise<Resource[]> => services.resources.list(args),

    getResource: async ({ resourceId }: { resourceId: string }): Promise<WithForgeUrl<Resource>> =>
      withResourceUrl(await services.resources.get(resourceId)),

    createResource: async (input: ResourceCreateInput): Promise<WithForgeUrl<Resource>> =>
      withResourceUrl(await services.resources.create(input)),

    updateResource,

    deleteResource: async ({ resourceId }: { resourceId: string }): Promise<{ id: string }> => {
      await services.resources.delete(resourceId);
      return { id: resourceId };
    },

    listNotes: (args: NoteListOptions): Promise<Note[]> => services.notes.list(args),

    getNote: ({ noteId }: { noteId: string }): Promise<Note> => services.notes.get(noteId),

    createNote: (input: NoteCreateInput): Promise<Note> => services.notes.create(input),

    updateNote,

    deleteNote: async ({ noteId }: { noteId: string }): Promise<{ id: string }> => {
      await services.notes.delete(noteId);
      return { id: noteId };
    },

    getProjectMap: ({ projectId }: { projectId: string }): Promise<ProjectMap> =>
      services.projectMap.getMap(projectId),

    getProjectFlow: ({
      projectId,
      slug,
    }: {
      projectId: string;
      slug: string;
    }): Promise<ProjectFlow> => services.projectMap.getFlow(projectId, slug),

    upsertProjectModule: ({
      projectId,
      ...input
    }: ProjectModuleUpsertInput & { projectId: string }): Promise<ProjectModule> =>
      services.projectMap.upsertModule(projectId, input),

    upsertProjectFlow: ({
      projectId,
      ...input
    }: ProjectFlowUpsertInput & { projectId: string }): Promise<ProjectFlow> =>
      services.projectMap.upsertFlow(projectId, input),

    deleteProjectModule: async ({
      projectId,
      slug,
    }: {
      projectId: string;
      slug: string;
    }): Promise<{ slug: string }> => {
      await services.projectMap.deleteModule(projectId, slug);
      return { slug };
    },

    deleteProjectFlow: async ({
      projectId,
      slug,
    }: {
      projectId: string;
      slug: string;
    }): Promise<{ slug: string }> => {
      await services.projectMap.deleteFlow(projectId, slug);
      return { slug };
    },

    createTicket: async (
      input: TicketCreateInput,
    ): Promise<WithForgeUrl<Ticket> & { projectName: string }> => {
      const project = await services.projects.get(input.projectId);
      const ticket = withTicketUrl(await services.board.create(input));
      return { ...ticket, projectName: project.name };
    },

    moveTicket: async (
      input: { ticketId: string; column: ColumnId } & TicketHandoffFields,
    ): Promise<WithForgeUrl<Ticket>> =>
      withTicketUrl(
        await services.board.move({
          id: input.ticketId,
          column: input.column,
          ...ticketUpdateFields(input),
        }),
      ),

    updateTicket: async ({
      ticketId,
      ...fields
    }: { ticketId: string } & TicketUpdateFields): Promise<WithForgeUrl<Ticket>> =>
      withTicketUrl(await services.board.update(ticketId, ticketUpdateFields(fields))),

    deleteTicket: async ({ ticketId }: { ticketId: string }): Promise<{ id: string }> => {
      await services.board.delete(ticketId);
      return { id: ticketId };
    },

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

    adjustTicketTime: async ({
      ticketId,
      ...fields
    }: {
      ticketId: string;
      set?: string;
      setTotal?: string;
      removeLast?: boolean;
      stopAt?: string;
      stopWith?: string;
    }): Promise<Ticket> => {
      const input = parseTicketTimeAdjustInput({
        id: ticketId,
        ...fields,
        removeLast: fields.removeLast || undefined,
      });
      if ("error" in input) throw new Error(input.error);
      return services.board.adjustTime(input);
    },
  };
}

export type ToolHandlers = ReturnType<typeof createToolHandlers>;

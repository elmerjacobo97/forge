import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import OAuthProvider from "@cloudflare/workers-oauth-provider";
import { McpAgent } from "agents/mcp";
import type { Env } from "./env.js";
import { createForgeSession } from "./forge-session.js";
import githubHandler from "./github-handler.js";
import { createForgeServices } from "./services.js";
import {
  activityReportInput,
  adjustTicketTimeInput,
  addTicketCommentInput,
  createProjectInput,
  createNoteInput,
  createResourceInput,
  createTicketInput,
  getProjectInput,
  getTicketInput,
  listNotesInput,
  listResourcesInput,
  listTicketsInput,
  moveTicketInput,
  nextTicketInput,
  noteIdInput,
  projectFlowInput,
  projectMapInput,
  resourceIdInput,
  ticketIdInput,
  updateNoteInput,
  updateResourceInput,
  updateTicketInput,
  upsertProjectFlowInput,
  upsertProjectModuleInput,
} from "./tool-schemas.js";
import { toToolError, toToolResult } from "./tool-result.js";
import { createToolHandlers, type ToolHandlers } from "./tools.js";

export class ForgeMcp extends McpAgent<Env> {
  server = new McpServer({ name: "forge-mcp", version: "0.1.0" });

  async init() {
    const session = createForgeSession({
      config: { url: this.env.INSFORGE_URL, anonKey: this.env.INSFORGE_ANON_KEY },
      seedRefreshToken: this.env.FORGE_REFRESH_TOKEN,
      store: {
        get: (key) => this.ctx.storage.get<string>(key),
        put: (key, value) => this.ctx.storage.put(key, value),
      },
    });

    const run = async (execute: (handlers: ToolHandlers) => Promise<unknown>) => {
      try {
        const accessToken = await session.getAccessToken();
        const services = createForgeServices(
          { url: this.env.INSFORGE_URL, anonKey: this.env.INSFORGE_ANON_KEY },
          accessToken,
        );
        return toToolResult(await execute(createToolHandlers(services)));
      } catch (error) {
        return toToolError(error);
      }
    };

    this.server.registerTool(
      "forge_list_projects",
      {
        description: "List Forge Dev Board projects.",
        inputSchema: {},
      },
      () => run((handlers) => handlers.listProjects()),
    );

    this.server.registerTool(
      "forge_get_project",
      {
        description: "Get a Forge project by id.",
        inputSchema: getProjectInput,
      },
      (args) => run((handlers) => handlers.getProject(args)),
    );

    this.server.registerTool(
      "forge_create_project",
      {
        description:
          "Create a Forge Dev Board project. Requires name (1 to 80 characters). description is optional (max 2000 characters) and defaults to empty; leave it empty if the user gave none. Use only what the user asked for: polish the wording, do not invent extra details. Result includes forgeUrl: give it to the user as the Forge link.",
        inputSchema: createProjectInput,
      },
      (args) => run((handlers) => handlers.createProject(args)),
    );

    this.server.registerTool(
      "forge_delete_project",
      {
        description:
          "Delete a Forge project by id. Only empty projects can be deleted; delete its tickets first. Returns the deleted id. Cannot be undone.",
        inputSchema: getProjectInput,
      },
      (args) => run((handlers) => handlers.deleteProject(args)),
    );

    this.server.registerTool(
      "forge_list_tickets",
      {
        description:
          "List a project's tickets, optionally filtered by column. Ticket summaries include complexity, startDate, and dueDate.",
        inputSchema: listTicketsInput,
      },
      (args) => run((handlers) => handlers.listTickets(args)),
    );

    this.server.registerTool(
      "forge_next_ticket",
      {
        description:
          "Get the best pending todo ticket with its planning fields, project, comments, and the tickets already in progress.",
        inputSchema: nextTicketInput,
      },
      (args) => run((handlers) => handlers.nextTicket(args)),
    );

    this.server.registerTool(
      "forge_get_ticket",
      {
        description: "Get a ticket with its planning fields and comment thread.",
        inputSchema: getTicketInput,
      },
      (args) => run((handlers) => handlers.getTicket(args)),
    );

    this.server.registerTool(
      "forge_activity_report",
      {
        description:
          "Summarize ticket activity in a rolling window (default 7 days) with optional project and column filters.",
        inputSchema: activityReportInput,
      },
      (args) => run((handlers) => handlers.activityReport(args)),
    );

    this.server.registerTool(
      "forge_create_ticket",
      {
        description:
          "Create a Dev Board ticket. Requires projectId and title. Write title and description only from what the user asked for: polish the wording, but do not invent acceptance criteria, platforms, test steps, or extra requirements. description defaults to empty, column to backlog, and priority to med. responsibleName is optional free text (max 120 characters). Optional planning fields are complexity (low, medium, high), startDate, and dueDate; dates require ISO 8601 timestamps with an explicit offset, and startDate must not follow dueDate. Result includes forgeUrl: give it to the user as the Forge link.",
        inputSchema: createTicketInput,
      },
      (args) => run((handlers) => handlers.createTicket(args)),
    );

    this.server.registerTool(
      "forge_move_ticket",
      {
        description:
          "Move a ticket to a column. Optional handoff: branch, prUrl, clearBranch, clearPrUrl. Moving to in_progress or validation starts the timer inside move_dev_board_ticket.",
        inputSchema: moveTicketInput,
      },
      (args) => run((handlers) => handlers.moveTicket(args)),
    );

    this.server.registerTool(
      "forge_update_ticket",
      {
        description:
          "Update branch, prUrl, responsibleName, or planning fields. Supported fields are branch, prUrl, clearBranch, clearPrUrl, responsibleName, clearResponsible, complexity, startDate, dueDate, clearStartDate, clearDueDate, and clearComplexity. Complexity is low, medium, or high; dates require ISO 8601 timestamps with an explicit offset. Omitted planning fields are preserved. At least one supported field is required. Does not change title, description, or priority.",
        inputSchema: updateTicketInput,
      },
      (args) => run((handlers) => handlers.updateTicket(args)),
    );

    this.server.registerTool(
      "forge_delete_ticket",
      {
        description: "Delete a Forge ticket by id. Returns the deleted id. Cannot be undone.",
        inputSchema: ticketIdInput,
      },
      (args) => run((handlers) => handlers.deleteTicket(args)),
    );

    this.server.registerTool(
      "forge_add_ticket_comment",
      {
        description:
          "Add a comment to a ticket. The author is always agent. body is 1 to 5000 characters. Use only what the user asked for: polish the wording, do not invent extra details.",
        inputSchema: addTicketCommentInput,
      },
      (args) => run((handlers) => handlers.addTicketComment(args)),
    );

    this.server.registerTool(
      "forge_pause_ticket",
      {
        description: "Pause the timer of an in-progress or validation ticket.",
        inputSchema: ticketIdInput,
      },
      (args) => run((handlers) => handlers.pauseTicket(args)),
    );

    this.server.registerTool(
      "forge_resume_ticket",
      {
        description: "Resume the timer of a paused in-progress or validation ticket.",
        inputSchema: ticketIdInput,
      },
      (args) => run((handlers) => handlers.resumeTicket(args)),
    );

    this.server.registerTool(
      "forge_adjust_ticket_time",
      {
        description:
          "Fix logged time on a ticket. Provide exactly one of: set (rewrite the last closed session), setTotal (set the logged total; only when the ticket has no time entries), removeLast (delete the last closed session, true), stopAt (stop the running session at 'now' or an ISO 8601 time), stopWith (stop the running session now, logging that duration even when longer than the elapsed time; the session start moves back). Durations need a unit, like 30m, 90m, 1h30m, or 2h. Every change adds an audit comment.",
        inputSchema: adjustTicketTimeInput,
      },
      (args) => run((handlers) => handlers.adjustTicketTime(args)),
    );

    this.server.registerTool(
      "forge_list_resources",
      {
        description:
          "List saved Forge resources (links), newest first. Optional category (docs, git, tool, article, other). Pass limit to page; offset requires limit. Without limit, returns every resource.",
        inputSchema: listResourcesInput,
      },
      (args) => run((handlers) => handlers.listResources(args)),
    );

    this.server.registerTool(
      "forge_get_resource",
      {
        description: "Get a Forge resource by id.",
        inputSchema: resourceIdInput,
      },
      (args) => run((handlers) => handlers.getResource(args)),
    );

    this.server.registerTool(
      "forge_create_resource",
      {
        description:
          "Save a Forge resource. Requires title (min 2 characters), url, category (docs, git, tool, article, other), and description (5 to 200 characters). tags defaults to empty. Use only what the user asked for: polish the wording, do not invent extra details. Result includes forgeUrl: give it to the user as the Forge link.",
        inputSchema: createResourceInput,
      },
      (args) => run((handlers) => handlers.createResource(args)),
    );

    this.server.registerTool(
      "forge_update_resource",
      {
        description:
          "Update a Forge resource. Supported fields are title, url, category, description, tags (replaces all tags), addTags (added to current tags, no duplicates), and removeTags (removed after addTags). Do not combine tags with addTags or removeTags. At least one field is required. Use only what the user asked for: polish the wording, do not invent extra details. Result includes forgeUrl: give it to the user as the Forge link.",
        inputSchema: updateResourceInput,
      },
      (args) => run((handlers) => handlers.updateResource(args)),
    );

    this.server.registerTool(
      "forge_delete_resource",
      {
        description: "Delete a Forge resource by id. Returns the deleted id. Cannot be undone.",
        inputSchema: resourceIdInput,
      },
      (args) => run((handlers) => handlers.deleteResource(args)),
    );

    this.server.registerTool(
      "forge_list_notes",
      {
        description:
          "Search the Forge notes knowledge base, newest first. Filters: q (matches title, content, and exact tag), tag (exact, lowercase), projectId. Pass limit to page; offset requires limit. Without limit, returns every match. Search here before relying on memory for fixes, configs, and decisions the user saved.",
        inputSchema: listNotesInput,
      },
      (args) => run((handlers) => handlers.listNotes(args)),
    );

    this.server.registerTool(
      "forge_get_note",
      {
        description: "Get a Forge note by id.",
        inputSchema: noteIdInput,
      },
      (args) => run((handlers) => handlers.getNote(args)),
    );

    this.server.registerTool(
      "forge_create_note",
      {
        description:
          "Save a Forge note. Requires title (2 to 200 characters) and content (markdown, up to 100000 characters). tags defaults to empty and is stored lowercase; put library versions in tags (for example rn-0.76). projectId is optional: omit it for global knowledge, set it only when the user names the project. Never store secrets, tokens, or credentials. Use only what the user asked for: polish the wording, do not invent extra details.",
        inputSchema: createNoteInput,
      },
      (args) => run((handlers) => handlers.createNote(args)),
    );

    this.server.registerTool(
      "forge_update_note",
      {
        description:
          "Update a Forge note. Supported fields are title, content, tags (replaces all tags), addTags (added to current tags, no duplicates), removeTags (removed after addTags), and projectId (null unlinks the project). Do not combine tags with addTags or removeTags. At least one field is required. Use only what the user asked for: polish the wording, do not invent extra details.",
        inputSchema: updateNoteInput,
      },
      (args) => run((handlers) => handlers.updateNote(args)),
    );

    this.server.registerTool(
      "forge_delete_note",
      {
        description: "Delete a Forge note by id. Returns the deleted id. Cannot be undone.",
        inputSchema: noteIdInput,
      },
      (args) => run((handlers) => handlers.deleteNote(args)),
    );

    this.server.registerTool(
      "forge_get_project_map",
      {
        description:
          "Get a project's map: its modules (slug, name, description, dependsOn) and a summary of its flows (slug, title, moduleSlug, stepCount). Call it before writing, so you reuse existing slugs.",
        inputSchema: projectMapInput,
      },
      (args) => run((handlers) => handlers.getProjectMap(args)),
    );

    this.server.registerTool(
      "forge_get_project_flow",
      {
        description: "Get one project flow by slug, with all its steps.",
        inputSchema: projectFlowInput,
      },
      (args) => run((handlers) => handlers.getProjectFlow(args)),
    );

    this.server.registerTool(
      "forge_upsert_project_module",
      {
        description:
          "Create or replace a project module by slug. Requires projectId, slug (lowercase letters, numbers, hyphens; max 60) and name. description defaults to empty. dependsOn lists slugs of other existing modules in the project, never its own slug. Write only what the code shows: every step must come from code you read or a graph edge, never invented; set inferred to true when a step does not come from a graph edge.",
        inputSchema: upsertProjectModuleInput,
      },
      (args) => run((handlers) => handlers.upsertProjectModule(args)),
    );

    this.server.registerTool(
      "forge_upsert_project_flow",
      {
        description:
          "Create or replace a step-by-step project flow by slug. Requires projectId, moduleSlug (an existing module), slug, title and steps (1 to 20; aim for 4 to 8). Each step has kind (page, ui, action, service, db, command, tool), label, and optionally symbol, file (relative to the repo), line, input, output, inferred (defaults to false). commit is the optional SHA the flow was read from. Write only what the code shows: every step must come from code you read or a graph edge, never invented; set inferred to true when a step does not come from a graph edge.",
        inputSchema: upsertProjectFlowInput,
      },
      (args) => run((handlers) => handlers.upsertProjectFlow(args)),
    );

    this.server.registerTool(
      "forge_delete_project_module",
      {
        description:
          "Delete a project module by slug and all its flows. Returns the deleted slug. Cannot be undone.",
        inputSchema: projectFlowInput,
      },
      (args) => run((handlers) => handlers.deleteProjectModule(args)),
    );

    this.server.registerTool(
      "forge_delete_project_flow",
      {
        description: "Delete a project flow by slug. Returns the deleted slug. Cannot be undone.",
        inputSchema: projectFlowInput,
      },
      (args) => run((handlers) => handlers.deleteProjectFlow(args)),
    );
  }
}

export default new OAuthProvider({
  apiRoute: "/mcp",
  apiHandler: ForgeMcp.serve("/mcp"),
  defaultHandler: githubHandler,
  authorizeEndpoint: "/authorize",
  tokenEndpoint: "/token",
  clientRegistrationEndpoint: "/register",
});

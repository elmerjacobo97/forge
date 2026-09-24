import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import OAuthProvider from "@cloudflare/workers-oauth-provider";
import { McpAgent } from "agents/mcp";
import type { Env } from "./env.js";
import { createForgeSession } from "./forge-session.js";
import githubHandler from "./github-handler.js";
import { createForgeServices } from "./services.js";
import {
  activityReportInput,
  addTicketCommentInput,
  createTicketInput,
  getProjectInput,
  getTicketInput,
  listTicketsInput,
  moveTicketInput,
  nextTicketInput,
  ticketIdInput,
  updateTicketInput,
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
      "forge_list_tickets",
      {
        description: "List the tickets of a project, optionally filtered by column.",
        inputSchema: listTicketsInput,
      },
      (args) => run((handlers) => handlers.listTickets(args)),
    );

    this.server.registerTool(
      "forge_next_ticket",
      {
        description:
          "Get the best pending todo ticket with its project, comments, and the tickets already in progress.",
        inputSchema: nextTicketInput,
      },
      (args) => run((handlers) => handlers.nextTicket(args)),
    );

    this.server.registerTool(
      "forge_get_ticket",
      {
        description: "Get a ticket with its comment thread.",
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
          "Create a Dev Board ticket. Requires projectId and title. description defaults to empty, column to backlog, and priority to med.",
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
          "Update ticket handoff only: branch, prUrl, clearBranch, or clearPrUrl. At least one is required. Does not change title, description, or priority.",
        inputSchema: updateTicketInput,
      },
      (args) => run((handlers) => handlers.updateTicket(args)),
    );

    this.server.registerTool(
      "forge_add_ticket_comment",
      {
        description:
          "Add a comment to a ticket. The author is always agent. body is 1 to 5000 characters.",
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

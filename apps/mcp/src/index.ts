import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import OAuthProvider from "@cloudflare/workers-oauth-provider";
import { McpAgent } from "agents/mcp";
import type { Env } from "./env.js";
import { createForgeSession } from "./forge-session.js";
import githubHandler from "./github-handler.js";
import { createForgeServices } from "./services.js";
import {
  activityReportInput,
  getProjectInput,
  getTicketInput,
  listTicketsInput,
  nextTicketInput,
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

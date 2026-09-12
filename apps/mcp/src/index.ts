import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { McpAgent } from "agents/mcp";
import type { Env } from "./env.js";
import { listProjects } from "./forge-projects.js";

export class ForgeMcp extends McpAgent<Env> {
  server = new McpServer({ name: "forge-mcp", version: "0.1.0" });

  async init() {
    this.server.registerTool(
      "forge_list_projects",
      {
        description: "List Forge Dev Board projects.",
        inputSchema: {},
      },
      async () => {
        const projects = await listProjects(this.env);
        return {
          content: [{ type: "text", text: JSON.stringify(projects) }],
        };
      },
    );
  }
}

export default ForgeMcp.serve("/mcp");

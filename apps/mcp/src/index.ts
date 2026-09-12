import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { McpAgent } from "agents/mcp";
import type { Env } from "./env.js";
import { listProjects } from "./forge-projects.js";
import { createForgeSession } from "./forge-session.js";

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

    this.server.registerTool(
      "forge_list_projects",
      {
        description: "List Forge Dev Board projects.",
        inputSchema: {},
      },
      async () => {
        const accessToken = await session.getAccessToken();
        const projects = await listProjects(this.env, accessToken);
        return {
          content: [{ type: "text", text: JSON.stringify(projects) }],
        };
      },
    );
  }
}

export default ForgeMcp.serve("/mcp");

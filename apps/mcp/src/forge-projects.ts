import { createForgeClient, createProjectsService } from "@forge/core";
import type { Project } from "@forge/core";
import type { Env } from "./env.js";

export async function listProjects(env: Env): Promise<Project[]> {
  const config = { url: env.INSFORGE_URL, anonKey: env.INSFORGE_ANON_KEY };
  const bootstrap = createForgeClient(config);
  const { data, error } = await bootstrap.auth.refreshSession({
    refreshToken: env.FORGE_REFRESH_TOKEN,
  });
  if (error) throw new Error(error.message);

  const record = data as { accessToken?: unknown };
  if (typeof record.accessToken !== "string" || record.accessToken.length === 0) {
    throw new Error("Session refresh did not return an access token.");
  }

  const client = createForgeClient(config, record.accessToken);
  return createProjectsService({ client }).list();
}

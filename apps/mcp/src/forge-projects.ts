import { createForgeClient, createProjectsService } from "@forge/core";
import type { Project } from "@forge/core";
import type { Env } from "./env.js";

export async function listProjects(env: Env, accessToken: string): Promise<Project[]> {
  const client = createForgeClient(
    { url: env.INSFORGE_URL, anonKey: env.INSFORGE_ANON_KEY },
    accessToken,
  );
  return createProjectsService({ client }).list();
}

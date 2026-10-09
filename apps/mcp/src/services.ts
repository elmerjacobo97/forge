import {
  createActivityService,
  createDevBoardService,
  createForgeClient,
  createProjectsService,
  createResourcesService,
} from "@forge/core";
import type { ForgeConfig } from "@forge/core";

export function createForgeServices(config: ForgeConfig, accessToken: string) {
  const client = createForgeClient(config, accessToken);
  return {
    projects: createProjectsService({ client }),
    board: createDevBoardService({ client }),
    activity: createActivityService({ client }),
    resources: createResourcesService({ client }),
  };
}

export type ForgeServices = ReturnType<typeof createForgeServices>;

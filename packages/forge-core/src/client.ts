import { createClient as createSdkClient, type InsForgeClient } from "@insforge/sdk";
import type { ForgeConfig } from "./types.js";

export function createForgeClient(config: ForgeConfig, accessToken?: string): InsForgeClient {
  return createSdkClient({
    baseUrl: config.url,
    anonKey: config.anonKey,
    accessToken,
    isServerMode: true,
  });
}

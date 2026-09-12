import { createForgeClient } from "@forge/core";
import type { ForgeConfig } from "@forge/core";

export const REFRESH_TOKEN_KEY = "forge.refreshToken";

export interface SessionStore {
  get(key: string): Promise<string | undefined>;
  put(key: string, value: string): Promise<void>;
}

export interface RefreshedSession {
  accessToken: string;
  refreshToken?: string;
}

export interface ForgeSessionOptions {
  config: ForgeConfig;
  seedRefreshToken: string;
  store: SessionStore;
  refresh?: (refreshToken: string) => Promise<RefreshedSession>;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function parseRefreshedSession(value: unknown): RefreshedSession {
  if (typeof value !== "object" || value === null) {
    throw new Error("Session refresh returned an invalid response.");
  }

  const record = value as Record<string, unknown>;
  const accessToken = record.accessToken;
  if (typeof accessToken !== "string" || accessToken.length === 0) {
    throw new Error("Session refresh response is missing accessToken.");
  }

  return {
    accessToken,
    refreshToken:
      typeof record.refreshToken === "string" && record.refreshToken.length > 0
        ? record.refreshToken
        : undefined,
  };
}

async function refreshWithSdk(
  config: ForgeConfig,
  refreshToken: string,
): Promise<RefreshedSession> {
  const client = createForgeClient(config);
  const { data, error } = await client.auth.refreshSession({ refreshToken });
  if (error) throw new Error(error.message);
  return parseRefreshedSession(data);
}

export function createForgeSession(options: ForgeSessionOptions) {
  const refresh =
    options.refresh ?? ((refreshToken: string) => refreshWithSdk(options.config, refreshToken));

  async function rotate(refreshToken: string): Promise<string> {
    const next = await refresh(refreshToken);
    if (next.refreshToken && next.refreshToken !== refreshToken) {
      await options.store.put(REFRESH_TOKEN_KEY, next.refreshToken);
    }
    return next.accessToken;
  }

  async function getAccessToken(): Promise<string> {
    const stored = await options.store.get(REFRESH_TOKEN_KEY);
    const candidates = stored ? [stored] : [options.seedRefreshToken];
    if (stored && stored !== options.seedRefreshToken) candidates.push(options.seedRefreshToken);

    let lastError: unknown;
    for (const candidate of candidates) {
      try {
        return await rotate(candidate);
      } catch (error) {
        lastError = error;
      }
    }

    throw new Error(
      `Forge session refresh failed: ${errorMessage(lastError)}. ` +
        'Run "forge-cli login" locally and update FORGE_REFRESH_TOKEN with "wrangler secret put".',
    );
  }

  return { getAccessToken };
}

export type ForgeSession = ReturnType<typeof createForgeSession>;

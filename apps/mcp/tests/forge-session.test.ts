import { describe, expect, it } from "vitest";
import {
  REFRESH_TOKEN_KEY,
  createForgeSession,
  type RefreshedSession,
  type SessionStore,
} from "../src/forge-session.js";

function memoryStore(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  const store: SessionStore & { data: Map<string, string> } = {
    data,
    get: async (key) => data.get(key),
    put: async (key, value) => {
      data.set(key, value);
    },
  };
  return store;
}

const config = { url: "https://example.insforge.app", anonKey: "anon" };

describe("createForgeSession", () => {
  it("seeds from the environment token and persists the rotated token", async () => {
    const store = memoryStore();
    const session = createForgeSession({
      config,
      seedRefreshToken: "seed-1",
      store,
      refresh: async (token): Promise<RefreshedSession> => ({
        accessToken: `access-for-${token}`,
        refreshToken: "seed-2",
      }),
    });

    await expect(session.getAccessToken()).resolves.toBe("access-for-seed-1");
    expect(store.data.get(REFRESH_TOKEN_KEY)).toBe("seed-2");
  });

  it("keeps the stored token when the refresh does not rotate", async () => {
    const store = memoryStore({ [REFRESH_TOKEN_KEY]: "stored-1" });
    const session = createForgeSession({
      config,
      seedRefreshToken: "seed-1",
      store,
      refresh: async (token) => ({ accessToken: `access-for-${token}` }),
    });

    await session.getAccessToken();
    expect(store.data.get(REFRESH_TOKEN_KEY)).toBe("stored-1");
  });

  it("falls back to the environment token when the stored token fails", async () => {
    const store = memoryStore({ [REFRESH_TOKEN_KEY]: "stale" });
    const attempted: string[] = [];
    const session = createForgeSession({
      config,
      seedRefreshToken: "seed-1",
      store,
      refresh: async (token) => {
        attempted.push(token);
        if (token === "stale") throw new Error("invalid refresh token");
        return { accessToken: "access-fresh", refreshToken: "seed-2" };
      },
    });

    await expect(session.getAccessToken()).resolves.toBe("access-fresh");
    expect(attempted).toEqual(["stale", "seed-1"]);
    expect(store.data.get(REFRESH_TOKEN_KEY)).toBe("seed-2");
  });

  it("throws an actionable error when every candidate fails", async () => {
    const store = memoryStore({ [REFRESH_TOKEN_KEY]: "stale" });
    const session = createForgeSession({
      config,
      seedRefreshToken: "seed-1",
      store,
      refresh: async () => {
        throw new Error("invalid refresh token");
      },
    });

    await expect(session.getAccessToken()).rejects.toThrow(/forge-cli login/);
  });
});

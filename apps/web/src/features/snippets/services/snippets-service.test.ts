import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const appwriteData = vi.hoisted(() => ({
  fetchFeatureRows: vi.fn(),
  createFeatureRow: vi.fn(),
  deleteFeatureRow: vi.fn(),
  isAppwriteDataEnabled: vi.fn(),
}));

vi.mock("@/lib/appwrite-data", () => appwriteData);

const { snippetsService } = await import("./snippets-service");
const storageDescriptor = Object.getOwnPropertyDescriptor(globalThis, "localStorage");

beforeEach(() => {
  vi.clearAllMocks();
  appwriteData.isAppwriteDataEnabled.mockReturnValue(true);
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    get: () => {
      throw new Error("Snippets must not use localStorage.");
    },
  });
});

afterEach(() => {
  if (storageDescriptor) Object.defineProperty(globalThis, "localStorage", storageDescriptor);
  else Reflect.deleteProperty(globalThis, "localStorage");
});

describe("snippetsService", () => {
  it("rejects requests without a signed-in user", async () => {
    await expect(snippetsService.fetchSnippets()).rejects.toThrow("Sign in to use Snippets.");
  });

  it("rejects requests when Appwrite storage is not configured", async () => {
    appwriteData.isAppwriteDataEnabled.mockReturnValue(false);

    await expect(snippetsService.fetchSnippets("user-1")).rejects.toThrow(
      "Snippets storage is not configured.",
    );
  });

  it("lists snippets through Appwrite without a local fallback", async () => {
    appwriteData.fetchFeatureRows.mockResolvedValue([
      {
        id: "snippet-1",
        createdAt: "2026-07-12T10:00:00.000Z",
        payload: {
          title: "Check status",
          kind: "snippet",
          content: "git status",
          language: "shell",
          tags: ["git"],
        },
      },
    ]);

    await expect(snippetsService.fetchSnippets("user-1")).resolves.toEqual([
      {
        id: "snippet-1",
        createdAt: "2026-07-12T10:00:00.000Z",
        title: "Check status",
        kind: "snippet",
        content: "git status",
        language: "shell",
        tags: ["git"],
      },
    ]);
    expect(appwriteData.fetchFeatureRows).toHaveBeenCalledWith("snippets", "user-1");
  });

  it("creates a snippet through Appwrite", async () => {
    const snippet = {
      title: "Check status",
      kind: "snippet" as const,
      content: "git status",
      language: "shell",
      tags: ["git"],
    };
    appwriteData.createFeatureRow.mockResolvedValue({
      id: "snippet-1",
      createdAt: "2026-07-12T10:00:00.000Z",
      payload: snippet,
    });

    await expect(snippetsService.createSnippet(snippet, "user-1")).resolves.toMatchObject({
      id: "snippet-1",
      ...snippet,
    });
    expect(appwriteData.createFeatureRow).toHaveBeenCalledWith("snippets", snippet, "user-1");
  });

  it("deletes a snippet through Appwrite", async () => {
    await expect(snippetsService.deleteSnippet("snippet-1", "user-1")).resolves.toBeUndefined();

    expect(appwriteData.deleteFeatureRow).toHaveBeenCalledWith("snippet-1");
  });
});

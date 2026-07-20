const database = vi.hoisted(() => ({ from: vi.fn() }));

vi.mock("@/lib/insforge/browser", () => ({ insforge: { database } }));

import { snippetsService } from "./snippets-service";

describe("snippetsService", () => {
  beforeEach(() => vi.clearAllMocks());

  it("requires an authenticated user", async () => {
    await expect(snippetsService.fetchSnippets()).rejects.toThrow("Sign in");
  });

  it("maps typed InsForge rows", async () => {
    const row = {
      id: "snippet-1",
      title: "Config",
      kind: "config",
      content: "strict=true",
      language: "toml",
      tags: ["tooling"],
      created_at: "2026-07-20T00:00:00.000Z",
    };
    const order = vi.fn().mockResolvedValue({ data: [row], error: null });
    database.from.mockReturnValue({ select: vi.fn(() => ({ order })) });

    await expect(snippetsService.fetchSnippets("user-1")).resolves.toEqual([
      { ...row, createdAt: row.created_at },
    ]);
  });
});

const database = vi.hoisted(() => ({ from: vi.fn() }));

vi.mock("@/lib/insforge/browser", () => ({ insforge: { database } }));

import { bookmarksService } from "./bookmarks-service";

const row = {
  id: "bookmark-1",
  title: "InsForge",
  url: "https://insforge.dev",
  category: "docs",
  description: "Backend documentation",
  tags: ["backend"],
  created_at: "2026-07-20T00:00:00.000Z",
};

describe("bookmarksService", () => {
  beforeEach(() => vi.clearAllMocks());

  it("requires an authenticated user", async () => {
    await expect(bookmarksService.fetchBookmarks()).rejects.toThrow("Sign in");
  });

  it("maps InsForge rows", async () => {
    const order = vi.fn().mockResolvedValue({ data: [row], error: null });
    database.from.mockReturnValue({ select: vi.fn(() => ({ order })) });

    await expect(bookmarksService.fetchBookmarks("user-1")).resolves.toEqual([
      { ...row, createdAt: row.created_at },
    ]);
  });
});

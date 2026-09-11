import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const database = vi.hoisted(() => ({ from: vi.fn() }));
const createInsForgeServerClient = vi.hoisted(() => vi.fn(async () => ({ database })));

vi.mock("@/lib/insforge/server", () => ({ createInsForgeServerClient }));

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

  it("maps InsForge rows", async () => {
    const order = vi.fn().mockResolvedValue({ data: [row], error: null });
    database.from.mockReturnValue({ select: vi.fn(() => ({ order })) });

    await expect(bookmarksService.fetchBookmarks()).resolves.toEqual([
      { ...row, createdAt: row.created_at },
    ]);
  });

  it("throws when InsForge returns an error", async () => {
    const order = vi.fn().mockResolvedValue({ data: null, error: { message: "boom" } });
    database.from.mockReturnValue({ select: vi.fn(() => ({ order })) });

    await expect(bookmarksService.fetchBookmarks()).rejects.toThrow("boom");
  });
});

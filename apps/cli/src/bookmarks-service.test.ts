import { describe, expect, it, vi } from "vitest";
import type { InsForgeClient } from "@insforge/sdk";
import { createBookmarksService, mapRowToBookmark } from "./bookmarks-service.js";

function createListClient(data: unknown) {
  const response = { data, error: null };
  const range = vi.fn().mockResolvedValue(response);
  const ordered = Object.assign(Promise.resolve(response), { range });
  const order = vi.fn(() => ordered);
  const select = vi.fn(() => ({ order }));
  const from = vi.fn(() => ({ select }));
  return { client: { database: { from } } as unknown as InsForgeClient, range };
}

describe("mapRowToBookmark", () => {
  const row = {
    id: "d7f1ce67-cf72-4f8e-8545-f0d2fb4ec501",
    title: "React docs",
    url: "https://react.dev",
    category: "docs",
    description: "Official React documentation",
    tags: ["react"],
    created_at: "2026-01-01T00:00:00.000Z",
  };

  it("maps a valid InsForge row to the stable CLI format", () => {
    expect(mapRowToBookmark(row)).toEqual({
      id: row.id,
      title: "React docs",
      url: "https://react.dev",
      category: "docs",
      description: "Official React documentation",
      tags: ["react"],
      createdAt: "2026-01-01T00:00:00.000Z",
    });
  });

  it("rejects malformed network fields", () => {
    expect(() => mapRowToBookmark({ ...row, tags: "react" })).toThrow(
      /tags must be a string array/,
    );
    expect(() => mapRowToBookmark({ ...row, category: "invalid" })).toThrow(
      /category must be one of/,
    );
  });
});

describe("bookmarksService.list options", () => {
  const row = {
    id: "d7f1ce67-cf72-4f8e-8545-f0d2fb4ec501",
    title: "React docs",
    url: "https://react.dev",
    category: "docs",
    description: "Official React documentation",
    tags: ["react"],
    created_at: "2026-01-01T00:00:00.000Z",
  };

  it("returns all rows without options", async () => {
    const { client, range } = createListClient([row]);
    const service = createBookmarksService({ client });

    await expect(service.list()).resolves.toEqual([
      {
        id: row.id,
        title: row.title,
        url: row.url,
        category: row.category,
        description: row.description,
        tags: row.tags,
        createdAt: row.created_at,
      },
    ]);
    expect(range).not.toHaveBeenCalled();
  });

  it("applies a range from the limit", async () => {
    const { client, range } = createListClient([row]);

    await createBookmarksService({ client }).list({ limit: 10 });

    expect(range).toHaveBeenCalledWith(0, 9);
  });

  it("applies the offset when both flags are present", async () => {
    const { client, range } = createListClient([row]);

    await createBookmarksService({ client }).list({ limit: 10, offset: 10 });

    expect(range).toHaveBeenCalledWith(10, 19);
  });
});

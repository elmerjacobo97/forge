import { describe, expect, it } from "vitest";
import { createIdeasService, mapRowToIdea } from "../../src/ideas-service.js";
import { createListClient } from "../helpers/insforge-client.js";

describe("mapRowToIdea", () => {
  const row = {
    id: "b4c9d2a1-1111-4a1a-9b2b-3c3d4e5f6a01",
    title: "Coffee meetup app",
    content: "An app that joins strangers for coffee.",
    status: "exploring",
    category: "mobile",
    tags: ["social"],
    links: ["https://example.com/inspiration"],
    created_at: "2026-09-01T00:00:00.000Z",
  };

  it("maps a valid InsForge row to the stable CLI format", () => {
    expect(mapRowToIdea(row)).toEqual({
      id: row.id,
      title: "Coffee meetup app",
      content: "An app that joins strangers for coffee.",
      status: "exploring",
      category: "mobile",
      tags: ["social"],
      links: ["https://example.com/inspiration"],
      createdAt: "2026-09-01T00:00:00.000Z",
    });
  });

  it("maps a row with empty tags and links", () => {
    expect(
      mapRowToIdea({
        ...row,
        title: "Quick spark",
        status: "seed",
        category: "other",
        tags: [],
        links: [],
      }),
    ).toEqual({
      id: row.id,
      title: "Quick spark",
      content: row.content,
      status: "seed",
      category: "other",
      tags: [],
      links: [],
      createdAt: row.created_at,
    });
  });

  it("rejects malformed rows", () => {
    expect(() => mapRowToIdea({ ...row, tags: "social" })).toThrow(/tags must be a string array/);
    expect(() => mapRowToIdea({ ...row, links: 42 })).toThrow(/links must be a string array/);
    expect(() => mapRowToIdea({ ...row, status: "invalid" })).toThrow(/status must be one of/);
    expect(() => mapRowToIdea({ ...row, category: "invalid" })).toThrow(/category must be one of/);
    expect(() => mapRowToIdea({ ...row, title: 42 })).toThrow(/title must be a string/);
  });
});

describe("ideasService.list options", () => {
  const row = {
    id: "b4c9d2a1-1111-4a1a-9b2b-3c3d4e5f6a01",
    title: "Coffee meetup app",
    content: "An app that joins strangers for coffee.",
    status: "exploring",
    category: "mobile",
    tags: ["social"],
    links: ["https://example.com/inspiration"],
    created_at: "2026-09-01T00:00:00.000Z",
  };

  it("returns all rows without options", async () => {
    const { client, range } = createListClient([row]);
    const service = createIdeasService({ client });

    await expect(service.list()).resolves.toEqual([
      {
        id: row.id,
        title: row.title,
        content: row.content,
        status: row.status,
        category: row.category,
        tags: row.tags,
        links: row.links,
        createdAt: row.created_at,
      },
    ]);
    expect(range).not.toHaveBeenCalled();
  });

  it("applies a range from the limit", async () => {
    const { client, range } = createListClient([row]);

    await createIdeasService({ client }).list({ limit: 10 });

    expect(range).toHaveBeenCalledWith(0, 9);
  });

  it("applies the offset when both flags are present", async () => {
    const { client, range } = createListClient([row]);

    await createIdeasService({ client }).list({ limit: 10, offset: 10 });

    expect(range).toHaveBeenCalledWith(10, 19);
  });
});

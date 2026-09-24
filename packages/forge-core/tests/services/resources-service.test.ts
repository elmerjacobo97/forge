import { describe, expect, it } from "vitest";
import { createResourcesService, mapRowToResource } from "../../src/resources-service.js";
import { createListClient } from "../helpers/insforge-client.js";

const row = {
  id: "d7f1ce67-cf72-4f8e-8545-f0d2fb4ec501",
  title: "React docs",
  url: "https://react.dev",
  category: "docs",
  description: "Official React documentation",
  tags: ["react"],
  created_at: "2026-01-01T00:00:00.000Z",
};

describe("mapRowToResource", () => {
  it("maps a resource row to the shared web and CLI shape", () => {
    expect(mapRowToResource(row)).toEqual({
      id: row.id,
      title: row.title,
      url: row.url,
      category: row.category,
      description: row.description,
      tags: row.tags,
      createdAt: row.created_at,
    });
  });

  it("rejects malformed rows", () => {
    expect(() => mapRowToResource({ ...row, tags: "react" })).toThrow(
      /tags must be a string array/,
    );
    expect(() => mapRowToResource({ ...row, category: "invalid" })).toThrow(
      /category must be one of/,
    );
  });
});

describe("resourcesService.list", () => {
  it("reads resources table and maps rows", async () => {
    const { client, from, range } = createListClient([row]);
    const service = createResourcesService({ client });

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
    expect(from).toHaveBeenCalledWith("resources");
    expect(range).not.toHaveBeenCalled();
  });

  it("applies limit and offset", async () => {
    const { client, range } = createListClient([row]);

    await createResourcesService({ client }).list({ limit: 10, offset: 10 });

    expect(range).toHaveBeenCalledWith(10, 19);
  });
});

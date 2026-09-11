import { describe, expect, it, vi } from "vitest";
import type { InsForgeClient } from "@insforge/sdk";
import { createResourcesService, mapRowToResource } from "./resources-service.js";

function createListClient(data: unknown) {
  const response = { data, error: null };
  const range = vi.fn().mockResolvedValue(response);
  const ordered = Object.assign(Promise.resolve(response), { range });
  const order = vi.fn(() => ordered);
  const select = vi.fn(() => ({ order }));
  const from = vi.fn(() => ({ select }));
  return { client: { database: { from } } as unknown as InsForgeClient, range };
}

describe("mapRowToResource", () => {
  const row = {
    id: "d7f1ce67-cf72-4f8e-8545-f0d2fb4ec501",
    title: "ESLint flat",
    kind: "config",
    content: "{}",
    language: "json",
    tags: ["eslint"],
    tool: "vscode",
    custom_tool: null,
    version: "9",
    context: "workspace",
    created_at: "2026-01-01T00:00:00.000Z",
  };

  it("maps a valid InsForge row to the stable CLI format", () => {
    expect(mapRowToResource(row)).toEqual({
      id: row.id,
      title: "ESLint flat",
      kind: "config",
      content: "{}",
      language: "json",
      tags: ["eslint"],
      tool: "vscode",
      customTool: null,
      version: "9",
      context: "workspace",
      createdAt: "2026-01-01T00:00:00.000Z",
    });
  });

  it("maps legacy rows with null metadata", () => {
    expect(
      mapRowToResource({
        id: row.id,
        title: "Quick note",
        kind: "note",
        content: "hello",
        language: null,
        tags: [],
        tool: null,
        custom_tool: null,
        version: null,
        context: null,
        created_at: row.created_at,
      }),
    ).toEqual({
      id: row.id,
      title: "Quick note",
      kind: "note",
      content: "hello",
      language: null,
      tags: [],
      tool: null,
      customTool: null,
      version: null,
      context: null,
      createdAt: "2026-01-01T00:00:00.000Z",
    });
  });

  it("rejects malformed rows", () => {
    expect(() => mapRowToResource({ ...row, tags: "eslint" })).toThrow(
      /tags must be a string array/,
    );
    expect(() => mapRowToResource({ ...row, kind: "invalid" })).toThrow(/kind must be one of/);
    expect(() => mapRowToResource({ ...row, tool: "invalid" })).toThrow(/tool must be one of/);
  });
});

describe("resourcesService.list options", () => {
  const row = {
    id: "d7f1ce67-cf72-4f8e-8545-f0d2fb4ec501",
    title: "ESLint flat",
    kind: "config",
    content: "{}",
    language: "json",
    tags: ["eslint"],
    tool: "vscode",
    custom_tool: null,
    version: "9",
    context: "workspace",
    created_at: "2026-01-01T00:00:00.000Z",
  };

  it("returns all rows without options", async () => {
    const { client, range } = createListClient([row]);
    const service = createResourcesService({ client });

    await expect(service.list()).resolves.toEqual([
      {
        id: row.id,
        title: row.title,
        kind: row.kind,
        content: row.content,
        language: row.language,
        tags: row.tags,
        tool: row.tool,
        customTool: null,
        version: row.version,
        context: row.context,
        createdAt: row.created_at,
      },
    ]);
    expect(range).not.toHaveBeenCalled();
  });

  it("applies a range from the limit", async () => {
    const { client, range } = createListClient([row]);

    await createResourcesService({ client }).list({ limit: 10 });

    expect(range).toHaveBeenCalledWith(0, 9);
  });

  it("applies the offset when both flags are present", async () => {
    const { client, range } = createListClient([row]);

    await createResourcesService({ client }).list({ limit: 10, offset: 10 });

    expect(range).toHaveBeenCalledWith(10, 19);
  });
});

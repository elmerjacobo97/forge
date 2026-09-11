import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const database = vi.hoisted(() => ({ from: vi.fn() }));
const createInsForgeServerClient = vi.hoisted(() => vi.fn(async () => ({ database })));

vi.mock("@/lib/insforge/server", () => ({ createInsForgeServerClient }));

import { buildOtherFormatFilter, buildResourceSearchFilter } from "../utils/query-filters";
import { resourcesService } from "./resources-service";

const filters = {
  q: "",
  kind: "all",
  tool: "all",
  format: "all",
  tag: "all",
} as const;

function mockFetchQueries(
  mainResult: { data: unknown; error: unknown; count?: number | null },
  tagRows: unknown,
) {
  const range = vi.fn().mockResolvedValue(mainResult);
  const query = {
    select: vi.fn(),
    eq: vi.fn(),
    or: vi.fn(),
    contains: vi.fn(),
    order: vi.fn(),
    range,
  };
  query.select.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  query.or.mockReturnValue(query);
  query.contains.mockReturnValue(query);
  query.order.mockReturnValue(query);

  const tagsSelect = vi.fn().mockResolvedValue({ data: tagRows, error: null });
  database.from.mockReturnValueOnce(query).mockReturnValueOnce({ select: tagsSelect });

  return query;
}

describe("resourcesService", () => {
  beforeEach(() => vi.clearAllMocks());

  it("maps rows with nullable resource metadata", async () => {
    const row = {
      id: "resource-1",
      title: "Legacy note",
      kind: "note",
      content: "Keep this resource",
      language: "toml",
      tags: ["tooling"],
      tool: null,
      custom_tool: null,
      version: null,
      context: null,
      created_at: "2026-07-20T00:00:00.000Z",
    };
    mockFetchQueries({ data: [row], error: null, count: 1 }, [{ tags: ["tooling"] }]);

    const page = await resourcesService.fetchResourcesPage(filters, 10);

    expect(page.resources).toEqual([
      {
        id: row.id,
        title: row.title,
        kind: row.kind,
        content: row.content,
        language: row.language,
        tags: row.tags,
        tool: row.tool,
        customTool: row.custom_tool,
        version: row.version,
        context: row.context,
        createdAt: row.created_at,
      },
    ]);
    expect(page.tags).toEqual(["tooling"]);
    expect(page.total).toBe(1);
  });

  it("maps complete configuration rows", async () => {
    const row = {
      id: "resource-2",
      title: "React Native config",
      kind: "config",
      content: '{"strict":true}',
      language: "json",
      tags: ["mobile", "config"],
      tool: "react-native",
      custom_tool: null,
      version: "0.75",
      context: "Shared mobile defaults",
      created_at: "2026-07-20T01:00:00.000Z",
    };
    mockFetchQueries({ data: [row], error: null, count: 1 }, [{ tags: ["mobile", "config"] }]);

    const page = await resourcesService.fetchResourcesPage(filters, 10);

    expect(page.resources).toEqual([
      {
        id: row.id,
        title: row.title,
        kind: row.kind,
        content: row.content,
        language: row.language,
        tags: row.tags,
        tool: row.tool,
        customTool: row.custom_tool,
        version: row.version,
        context: row.context,
        createdAt: row.created_at,
      },
    ]);
    expect(page.tags).toEqual(["config", "mobile"]);
    expect(page.total).toBe(1);
  });

  it("applies the visible parameter, exact count and stable order", async () => {
    const query = mockFetchQueries({ data: [], error: null, count: 0 }, []);

    await resourcesService.fetchResourcesPage(filters, 25);

    expect(query.select).toHaveBeenCalledWith(expect.stringContaining("id,title"), {
      count: "exact",
    });
    expect(query.order).toHaveBeenNthCalledWith(1, "created_at", { ascending: false });
    expect(query.order).toHaveBeenNthCalledWith(2, "id", { ascending: false });
    expect(query.range).toHaveBeenCalledWith(0, 24);
  });

  it("applies kind, tool, tag and format filters server-side", async () => {
    const query = mockFetchQueries({ data: [], error: null, count: 0 }, []);

    await resourcesService.fetchResourcesPage(
      { q: "", kind: "config", tool: "vscode", format: "json", tag: "eslint" },
      10,
    );

    expect(query.eq).toHaveBeenCalledWith("kind", "config");
    expect(query.eq).toHaveBeenCalledWith("tool", "vscode");
    expect(query.eq).toHaveBeenCalledWith("language", "json");
    expect(query.contains).toHaveBeenCalledWith("tags", ["eslint"]);
    expect(query.or).not.toHaveBeenCalled();
  });

  it("maps the other format filter to an or expression", async () => {
    const query = mockFetchQueries({ data: [], error: null, count: 0 }, []);

    await resourcesService.fetchResourcesPage({ ...filters, format: "other" }, 10);

    expect(query.or).toHaveBeenCalledWith(buildOtherFormatFilter());
    expect(query.eq).not.toHaveBeenCalled();
  });

  it("combines the other format and search filters", async () => {
    const query = mockFetchQueries({ data: [], error: null, count: 0 }, []);

    await resourcesService.fetchResourcesPage({ ...filters, format: "other", q: "  react  " }, 10);

    expect(query.or).toHaveBeenNthCalledWith(1, buildOtherFormatFilter());
    expect(query.or).toHaveBeenNthCalledWith(2, buildResourceSearchFilter("react"));
  });

  it("defaults the total to 0 when count is null", async () => {
    mockFetchQueries({ data: [], error: null, count: null }, []);

    await expect(resourcesService.fetchResourcesPage(filters, 10)).resolves.toMatchObject({
      total: 0,
    });
  });

  it("throws when InsForge returns an error", async () => {
    mockFetchQueries({ data: null, error: { message: "boom" }, count: null }, []);

    await expect(resourcesService.fetchResourcesPage(filters, 10)).rejects.toThrow("boom");
  });

  it("persists configuration metadata with nullable optional fields", async () => {
    const row = {
      id: "resource-3",
      title: "VS Code config",
      kind: "config",
      content: "editor.formatOnSave=true",
      language: "plain-text",
      tags: ["editor"],
      tool: "vscode",
      custom_tool: null,
      version: null,
      context: null,
      created_at: "2026-07-20T02:00:00.000Z",
    };
    const single = vi.fn().mockResolvedValue({ data: row, error: null });
    const select = vi.fn(() => ({ single }));
    const insert = vi.fn(() => ({ select }));
    database.from.mockReturnValue({ insert });

    const input = {
      title: "VS Code config",
      kind: "config" as const,
      content: "editor.formatOnSave=true",
      language: "plain-text",
      tags: ["editor"],
      tool: "vscode" as const,
      customTool: null,
      version: null,
      context: null,
    };

    await expect(resourcesService.createResource(input)).resolves.toEqual({
      id: row.id,
      title: row.title,
      kind: row.kind,
      content: row.content,
      language: row.language,
      tags: row.tags,
      tool: row.tool,
      customTool: row.custom_tool,
      version: row.version,
      context: row.context,
      createdAt: row.created_at,
    });
    expect(insert).toHaveBeenCalledWith([
      {
        title: input.title,
        kind: input.kind,
        content: input.content,
        language: input.language,
        tags: input.tags,
        tool: input.tool,
        custom_tool: input.customTool,
        version: input.version,
        context: input.context,
      },
    ]);
  });

  it("updates configuration metadata with database column names", async () => {
    const row = {
      id: "resource-4",
      title: "Custom tool config",
      kind: "config",
      content: "enabled=true",
      language: "env",
      tags: ["custom"],
      tool: "other",
      custom_tool: "Internal CLI",
      version: "2.0",
      context: "Build environment",
      created_at: "2026-07-20T03:00:00.000Z",
    };
    const single = vi.fn().mockResolvedValue({ data: row, error: null });
    const select = vi.fn(() => ({ single }));
    const eq = vi.fn(() => ({ select }));
    const update = vi.fn(() => ({ eq }));
    database.from.mockReturnValue({ update });

    const input = {
      title: row.title,
      kind: "config" as const,
      content: row.content,
      language: row.language,
      tags: row.tags,
      tool: "other" as const,
      customTool: row.custom_tool,
      version: row.version,
      context: row.context,
    };

    await expect(resourcesService.updateResource(row.id, input)).resolves.toMatchObject({
      id: row.id,
      tool: row.tool,
      customTool: row.custom_tool,
      version: row.version,
      context: row.context,
    });
    expect(update).toHaveBeenCalledWith({
      title: input.title,
      kind: input.kind,
      content: input.content,
      language: input.language,
      tags: input.tags,
      tool: input.tool,
      custom_tool: input.customTool,
      version: input.version,
      context: input.context,
    });
    expect(eq).toHaveBeenCalledWith("id", row.id);
  });
});

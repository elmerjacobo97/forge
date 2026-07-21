import { beforeEach, describe, expect, it, vi } from "vitest";

const database = vi.hoisted(() => ({ from: vi.fn() }));

vi.mock("@/lib/insforge/browser", () => ({ insforge: { database } }));

import { resourcesService } from "./resources-service";

describe("resourcesService", () => {
  beforeEach(() => vi.clearAllMocks());

  it("requires an authenticated user", async () => {
    await expect(resourcesService.fetchResources()).rejects.toThrow("Sign in");
  });

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
    const order = vi.fn().mockResolvedValue({ data: [row], error: null });
    database.from.mockReturnValue({ select: vi.fn(() => ({ order })) });

    await expect(resourcesService.fetchResources("user-1")).resolves.toEqual([
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
    const order = vi.fn().mockResolvedValue({ data: [row], error: null });
    database.from.mockReturnValue({ select: vi.fn(() => ({ order })) });

    await expect(resourcesService.fetchResources("user-1")).resolves.toEqual([
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

    await expect(resourcesService.createResource(input, "user-1")).resolves.toEqual({
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

    await expect(resourcesService.updateResource(row.id, input, "user-1")).resolves.toMatchObject({
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

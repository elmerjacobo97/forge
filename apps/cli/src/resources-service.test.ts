import { describe, expect, it } from "vitest"
import { mapRowToResource } from "./resources-service.js"

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
  }

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
    })
  })

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
    })
  })

  it("rejects malformed rows", () => {
    expect(() => mapRowToResource({ ...row, tags: "eslint" })).toThrow(
      /tags must be a string array/,
    )
    expect(() => mapRowToResource({ ...row, kind: "invalid" })).toThrow(
      /kind must be one of/,
    )
    expect(() => mapRowToResource({ ...row, tool: "invalid" })).toThrow(
      /tool must be one of/,
    )
  })
})

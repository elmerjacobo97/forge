import { describe, expect, it } from "vitest"
import {
  parseResourceCreateInput,
  parseResourceUpdateInput,
} from "./resource-schema.js"

describe("parseResourceCreateInput", () => {
  it("accepts a valid note payload", () => {
    const result = parseResourceCreateInput({
      title: "Quick note",
      kind: "note",
      content: "Remember to ship the CLI.",
      language: "",
      tags: ["cli"],
      tool: "",
      customTool: "",
      version: "",
      context: "",
    })

    expect(result).toEqual({
      title: "Quick note",
      kind: "note",
      content: "Remember to ship the CLI.",
      language: null,
      tags: ["cli"],
      tool: null,
      customTool: null,
      version: null,
      context: null,
    })
  })

  it("accepts a valid config payload with tool metadata", () => {
    const result = parseResourceCreateInput({
      title: "ESLint flat",
      kind: "config",
      content: "{}",
      language: "json",
      tags: ["eslint"],
      tool: "vscode",
      customTool: "",
      version: "9",
      context: "workspace",
    })

    expect(result).toEqual({
      title: "ESLint flat",
      kind: "config",
      content: "{}",
      language: "json",
      tags: ["eslint"],
      tool: "vscode",
      customTool: null,
      version: "9",
      context: "workspace",
    })
  })

  it("rejects config without tool and other without custom tool", () => {
    const missingTool = parseResourceCreateInput({
      title: "ESLint flat",
      kind: "config",
      content: "{}",
      tags: [],
      tool: "",
    })
    expect(missingTool).toHaveProperty("error")
    if (!("error" in missingTool)) throw new Error("expected validation error")
    expect(missingTool.error).toContain("Tool is required for configurations")

    const missingCustomTool = parseResourceCreateInput({
      title: "Custom tool config",
      kind: "config",
      content: "{}",
      tags: [],
      tool: "other",
      customTool: "",
    })
    expect(missingCustomTool).toHaveProperty("error")
    if (!("error" in missingCustomTool)) {
      throw new Error("expected validation error")
    }
    expect(missingCustomTool.error).toContain("Custom tool name is required")
  })

  it("requires missing create fields with clear messages", () => {
    const result = parseResourceCreateInput({ tags: [] })

    expect(result).toHaveProperty("error")
    if (!("error" in result)) throw new Error("expected validation error")
    expect(result.error).toContain("Title is required (--title).")
    expect(result.error).toContain("Content is required (--content).")
  })
})

describe("parseResourceUpdateInput", () => {
  it("accepts a partial update", () => {
    const result = parseResourceUpdateInput({ title: "Updated title" })
    expect(result).toEqual({ title: "Updated title" })
  })

  it("rejects an empty update", () => {
    const result = parseResourceUpdateInput({})
    expect(result).toHaveProperty("error")
    if (!("error" in result)) throw new Error("expected validation error")
    expect(result.error).toContain("Provide at least one field to update.")
  })

  it("requires tool when changing kind to config", () => {
    const result = parseResourceUpdateInput({ kind: "config" })
    expect(result).toHaveProperty("error")
    if (!("error" in result)) throw new Error("expected validation error")
    expect(result.error).toContain("Tool is required for configurations")
  })

  it("clears config metadata when kind changes away from config", () => {
    const result = parseResourceUpdateInput({ kind: "note" })
    expect(result).toEqual({
      kind: "note",
      tool: null,
      customTool: null,
      version: null,
      context: null,
    })
  })
})

import { describe, expect, it } from "vitest"
import {
  parseProjectCreateInput,
  parseProjectUpdateInput,
} from "./project-schema.js"

describe("parseProjectCreateInput", () => {
  it("accepts a valid project payload", () => {
    const result = parseProjectCreateInput({
      name: "Forge",
      description: "Dev tools",
    })

    expect(result).toEqual({
      name: "Forge",
      description: "Dev tools",
    })
  })

  it("accepts empty description and trims name", () => {
    const result = parseProjectCreateInput({
      name: "  Forge  ",
      description: "",
    })

    expect(result).toEqual({
      name: "Forge",
      description: "",
    })
  })

  it("trims description", () => {
    const result = parseProjectCreateInput({
      name: "Forge",
      description: "  notes  ",
    })

    expect(result).toEqual({
      name: "Forge",
      description: "notes",
    })
  })

  it("rejects empty name", () => {
    const result = parseProjectCreateInput({
      name: "   ",
      description: "",
    })

    expect(result).toHaveProperty("error")
    if (!("error" in result)) throw new Error("expected validation error")
    expect(result.error).toContain("Name is required.")
  })

  it("rejects name longer than 80 and description longer than 2000", () => {
    const result = parseProjectCreateInput({
      name: "x".repeat(81),
      description: "y".repeat(2001),
    })

    expect(result).toHaveProperty("error")
    if (!("error" in result)) throw new Error("expected validation error")
    expect(result.error).toContain("Name must be at most 80 characters.")
    expect(result.error).toContain(
      "Description must be at most 2000 characters.",
    )
  })

  it("requires missing create fields with clear messages", () => {
    const result = parseProjectCreateInput({})

    expect(result).toHaveProperty("error")
    if (!("error" in result)) throw new Error("expected validation error")
    expect(result.error).toContain("Name is required (--name).")
  })
})

describe("parseProjectUpdateInput", () => {
  it("accepts a partial update", () => {
    const result = parseProjectUpdateInput({ name: "Updated name" })
    expect(result).toEqual({ name: "Updated name" })
  })

  it("accepts description-only update", () => {
    const result = parseProjectUpdateInput({ description: "New notes" })
    expect(result).toEqual({ description: "New notes" })
  })

  it("rejects an empty update", () => {
    const result = parseProjectUpdateInput({})
    expect(result).toHaveProperty("error")
    if (!("error" in result)) throw new Error("expected validation error")
    expect(result.error).toContain("Provide at least one field to update")
  })

  it("rejects invalid name in a partial update", () => {
    const result = parseProjectUpdateInput({ name: "   " })
    expect(result).toHaveProperty("error")
    if (!("error" in result)) throw new Error("expected validation error")
    expect(result.error).toContain("Name is required.")
  })
})

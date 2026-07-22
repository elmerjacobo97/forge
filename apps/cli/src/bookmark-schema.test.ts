import { describe, expect, it } from "vitest"
import {
  parseBookmarkCreateInput,
  parseBookmarkUpdateInput,
} from "./bookmark-schema.js"

describe("parseBookmarkCreateInput", () => {
  it("accepts a valid bookmark payload", () => {
    const result = parseBookmarkCreateInput({
      title: "React docs",
      url: "https://react.dev",
      category: "docs",
      description: "Official React documentation",
      tags: ["react", "docs"],
    })

    expect(result).toEqual({
      title: "React docs",
      url: "https://react.dev",
      category: "docs",
      description: "Official React documentation",
      tags: ["react", "docs"],
    })
  })

  it("rejects short title, bad url, unknown category, and short description", () => {
    const result = parseBookmarkCreateInput({
      title: "x",
      url: "not-a-url",
      category: "nope",
      description: "hi",
      tags: [],
    })

    expect(result).toHaveProperty("error")
    if (!("error" in result)) throw new Error("expected validation error")
    expect(result.error).toContain("Title must be at least 2 characters.")
    expect(result.error).toContain("Must be a valid URL.")
    expect(result.error).toContain("Category must be one of:")
    expect(result.error).toContain("Description must be at least 5 characters.")
  })

  it("rejects description longer than 200 characters", () => {
    const result = parseBookmarkCreateInput({
      title: "Long desc",
      url: "https://example.com",
      category: "article",
      description: "x".repeat(201),
      tags: [],
    })

    expect(result).toHaveProperty("error")
    if (!("error" in result)) throw new Error("expected validation error")
    expect(result.error).toContain(
      "Description must be at most 200 characters.",
    )
  })

  it("requires missing create fields with clear messages", () => {
    const result = parseBookmarkCreateInput({ tags: [] })

    expect(result).toHaveProperty("error")
    if (!("error" in result)) throw new Error("expected validation error")
    expect(result.error).toContain("Title is required (--title).")
    expect(result.error).toContain("URL is required (--url).")
    expect(result.error).toContain("Description is required (--description).")
  })
})

describe("parseBookmarkUpdateInput", () => {
  it("accepts a partial update", () => {
    const result = parseBookmarkUpdateInput({ title: "Updated title" })
    expect(result).toEqual({ title: "Updated title" })
  })

  it("rejects an empty update", () => {
    const result = parseBookmarkUpdateInput({})
    expect(result).toHaveProperty("error")
    if (!("error" in result)) throw new Error("expected validation error")
    expect(result.error).toContain("Provide at least one field to update.")
  })

  it("rejects invalid fields in a partial update", () => {
    const result = parseBookmarkUpdateInput({ url: "bad" })
    expect(result).toHaveProperty("error")
    if (!("error" in result)) throw new Error("expected validation error")
    expect(result.error).toContain("Must be a valid URL.")
  })
})

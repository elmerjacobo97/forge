import { describe, expect, it } from "vitest"
import { mapRowToBookmark } from "./bookmarks-service.js"

describe("mapRowToBookmark", () => {
  const row = {
    id: "d7f1ce67-cf72-4f8e-8545-f0d2fb4ec501",
    title: "React docs",
    url: "https://react.dev",
    category: "docs",
    description: "Official React documentation",
    tags: ["react"],
    created_at: "2026-01-01T00:00:00.000Z",
  }

  it("maps a valid InsForge row to the stable CLI format", () => {
    expect(mapRowToBookmark(row)).toEqual({
      id: row.id,
      title: "React docs",
      url: "https://react.dev",
      category: "docs",
      description: "Official React documentation",
      tags: ["react"],
      createdAt: "2026-01-01T00:00:00.000Z",
    })
  })

  it("rejects malformed network fields", () => {
    expect(() => mapRowToBookmark({ ...row, tags: "react" })).toThrow(
      /tags must be a string array/,
    )
    expect(() => mapRowToBookmark({ ...row, category: "invalid" })).toThrow(
      /category must be one of/,
    )
  })
})

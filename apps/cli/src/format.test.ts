import { describe, expect, it } from "vitest"
import {
  formatBookmarkJson,
  formatBookmarkListJson,
  formatBookmarkListText,
  formatBookmarkText,
} from "./format.js"
import type { Bookmark } from "./types.js"

const sample: Bookmark = {
  id: "row1",
  title: "React docs",
  url: "https://react.dev",
  category: "docs",
  description: "Official React documentation",
  tags: ["react", "docs"],
  createdAt: "2026-01-01T00:00:00.000Z",
}

describe("formatBookmarkText", () => {
  it("renders a readable bookmark block", () => {
    const text = formatBookmarkText(sample)
    expect(text).toContain("id:          row1")
    expect(text).toContain("title:       React docs")
    expect(text).toContain("tags:        react, docs")
  })

  it("shows (none) when tags are empty", () => {
    expect(formatBookmarkText({ ...sample, tags: [] })).toContain(
      "tags:        (none)",
    )
  })
})

describe("formatBookmarkListText", () => {
  it("handles an empty list", () => {
    expect(formatBookmarkListText([])).toBe("No bookmarks.")
  })
})

describe("JSON formatters", () => {
  it("emits parseable bookmark JSON", () => {
    const parsed = JSON.parse(formatBookmarkJson(sample)) as Bookmark
    expect(parsed).toEqual(sample)
  })

  it("emits a parseable bookmark array", () => {
    const parsed = JSON.parse(formatBookmarkListJson([sample])) as Bookmark[]
    expect(parsed).toEqual([sample])
  })
})

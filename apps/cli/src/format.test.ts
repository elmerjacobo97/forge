import { describe, expect, it } from "vitest"
import {
  formatBookmarkJson,
  formatBookmarkListJson,
  formatBookmarkListText,
  formatBookmarkText,
  formatTicketJson,
  formatTicketListJson,
  formatTicketListText,
  formatTicketText,
} from "./format.js"
import type { Bookmark, Ticket } from "./types.js"

const sampleBookmark: Bookmark = {
  id: "row1",
  title: "React docs",
  url: "https://react.dev",
  category: "docs",
  description: "Official React documentation",
  tags: ["react", "docs"],
  createdAt: "2026-01-01T00:00:00.000Z",
}

const sampleTicket: Ticket = {
  id: "t1",
  title: "Ship CLI tickets",
  description: "CRUD + move",
  column: "todo",
  position: 1000,
  priority: "high",
  createdAt: "2026-07-18T12:00:00.000Z",
  timerStartedAt: null,
  totalElapsedMs: 65_000,
  isPaused: false,
  lastMovedAt: "2026-07-18T13:00:00.000Z",
}

describe("formatBookmarkText", () => {
  it("renders a readable bookmark block", () => {
    const text = formatBookmarkText(sampleBookmark)
    expect(text).toContain("id:          row1")
    expect(text).toContain("title:       React docs")
    expect(text).toContain("tags:        react, docs")
  })

  it("shows (none) when tags are empty", () => {
    expect(formatBookmarkText({ ...sampleBookmark, tags: [] })).toContain(
      "tags:        (none)",
    )
  })
})

describe("formatBookmarkListText", () => {
  it("handles an empty list", () => {
    expect(formatBookmarkListText([])).toBe("No bookmarks.")
  })
})

describe("bookmark JSON formatters", () => {
  it("emits parseable bookmark JSON", () => {
    const parsed = JSON.parse(formatBookmarkJson(sampleBookmark)) as Bookmark
    expect(parsed).toEqual(sampleBookmark)
  })

  it("emits a parseable bookmark array", () => {
    const parsed = JSON.parse(
      formatBookmarkListJson([sampleBookmark]),
    ) as Bookmark[]
    expect(parsed).toEqual([sampleBookmark])
  })
})

describe("formatTicketText", () => {
  it("renders id, title, column, priority, and timer summary", () => {
    const text = formatTicketText(sampleTicket)
    expect(text).toContain("id:          t1")
    expect(text).toContain("title:       Ship CLI tickets")
    expect(text).toContain("column:      todo")
    expect(text).toContain("priority:    high")
    expect(text).toContain("timer:       stopped (logged 1:05)")
  })

  it("shows running and paused timer states", () => {
    expect(
      formatTicketText({
        ...sampleTicket,
        timerStartedAt: "2026-07-18T14:00:00.000Z",
        totalElapsedMs: 3_600_000,
      }),
    ).toContain("timer:       running (logged 1:00:00)")

    expect(
      formatTicketText({
        ...sampleTicket,
        isPaused: true,
        totalElapsedMs: 0,
      }),
    ).toContain("timer:       paused (logged 0:00)")
  })

  it("shows (none) for empty description", () => {
    expect(
      formatTicketText({ ...sampleTicket, description: "" }),
    ).toContain("description: (none)")
  })
})

describe("formatTicketListText", () => {
  it("handles an empty list", () => {
    expect(formatTicketListText([])).toBe("No tickets.")
  })
})

describe("ticket JSON formatters", () => {
  it("emits parseable ticket JSON", () => {
    const parsed = JSON.parse(formatTicketJson(sampleTicket)) as Ticket
    expect(parsed).toEqual(sampleTicket)
  })

  it("emits a parseable ticket array (list --json)", () => {
    const parsed = JSON.parse(
      formatTicketListJson([sampleTicket]),
    ) as Ticket[]
    expect(parsed).toEqual([sampleTicket])
  })
})

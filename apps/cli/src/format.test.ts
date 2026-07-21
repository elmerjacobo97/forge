import { describe, expect, it } from "vitest"
import {
  formatBookmarkJson,
  formatBookmarkListJson,
  formatBookmarkListText,
  formatBookmarkText,
  formatProjectJson,
  formatProjectListJson,
  formatProjectListText,
  formatProjectText,
  formatResourceJson,
  formatResourceListJson,
  formatResourceListText,
  formatResourceText,
  formatTicketJson,
  formatTicketListJson,
  formatTicketListText,
  formatTicketText,
} from "./format.js"
import type { Bookmark, Project, Resource, Ticket } from "./types.js"

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
  projectId: "p1",
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

const sampleProject: Project = {
  id: "p1",
  name: "Forge",
  description: "Dev tools",
  createdAt: "2026-07-19T08:00:00.000Z",
}

const sampleResource: Resource = {
  id: "r1",
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
  it("renders id, projectId, title, column, priority, and timer summary", () => {
    const text = formatTicketText(sampleTicket)
    expect(text).toContain("id:          t1")
    expect(text).toContain("projectId:   p1")
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

describe("formatProjectText", () => {
  it("renders id, name, description, and createdAt", () => {
    const text = formatProjectText(sampleProject)
    expect(text).toContain("id:          p1")
    expect(text).toContain("name:        Forge")
    expect(text).toContain("description: Dev tools")
    expect(text).toContain("createdAt:   2026-07-19T08:00:00.000Z")
  })

  it("shows (none) for empty description", () => {
    expect(
      formatProjectText({ ...sampleProject, description: "" }),
    ).toContain("description: (none)")
  })

  it("shortens long descriptions in text output", () => {
    const long = "x".repeat(100)
    const text = formatProjectText({ ...sampleProject, description: long })
    expect(text).toContain("description: ")
    expect(text).toContain("…")
    expect(text).not.toContain(long)
  })
})

describe("formatProjectListText", () => {
  it("handles an empty list", () => {
    expect(formatProjectListText([])).toBe("No projects.")
  })
})

describe("project JSON formatters", () => {
  it("emits parseable project JSON", () => {
    const parsed = JSON.parse(formatProjectJson(sampleProject)) as Project
    expect(parsed).toEqual(sampleProject)
  })

  it("emits a parseable project array (list --json)", () => {
    const parsed = JSON.parse(
      formatProjectListJson([sampleProject]),
    ) as Project[]
    expect(parsed).toEqual([sampleProject])
  })
})

describe("formatResourceText", () => {
  it("renders a readable resource block", () => {
    const text = formatResourceText(sampleResource)
    expect(text).toContain("id:          r1")
    expect(text).toContain("title:       ESLint flat")
    expect(text).toContain("kind:        config")
    expect(text).toContain("tool:        vscode")
    expect(text).toContain("tags:        eslint")
  })

  it("shows (none) for empty optional fields", () => {
    expect(
      formatResourceText({
        ...sampleResource,
        language: null,
        tags: [],
        tool: null,
        customTool: null,
        version: null,
        context: null,
      }),
    ).toContain("language:    (none)")
  })
})

describe("formatResourceListText", () => {
  it("handles an empty list", () => {
    expect(formatResourceListText([])).toBe("No resources.")
  })
})

describe("resource JSON formatters", () => {
  it("emits parseable resource JSON", () => {
    const parsed = JSON.parse(formatResourceJson(sampleResource)) as Resource
    expect(parsed).toEqual(sampleResource)
  })

  it("emits a parseable resource array", () => {
    const parsed = JSON.parse(
      formatResourceListJson([sampleResource]),
    ) as Resource[]
    expect(parsed).toEqual([sampleResource])
  })
})

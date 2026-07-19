import { describe, expect, it } from "vitest"
import {
  parseColumnId,
  parsePriority,
  parseTicketCreateInput,
  parseTicketMoveInput,
  parseTicketUpdateInput,
} from "./ticket-schema.js"

describe("parseTicketCreateInput", () => {
  it("accepts a valid ticket payload", () => {
    const result = parseTicketCreateInput({
      title: "Ship CLI tickets",
      description: "CRUD + move",
      priority: "med",
      column: "backlog",
    })

    expect(result).toEqual({
      title: "Ship CLI tickets",
      description: "CRUD + move",
      priority: "med",
      column: "backlog",
    })
  })

  it("accepts empty description and trims title", () => {
    const result = parseTicketCreateInput({
      title: "  Fix bug  ",
      description: "",
      priority: "high",
      column: "todo",
    })

    expect(result).toEqual({
      title: "Fix bug",
      description: "",
      priority: "high",
      column: "todo",
    })
  })

  it("rejects empty title, unknown priority, and invalid column", () => {
    const result = parseTicketCreateInput({
      title: "   ",
      description: "ok",
      priority: "urgent",
      column: "archive",
    })

    expect(result).toHaveProperty("error")
    if (!("error" in result)) throw new Error("expected validation error")
    expect(result.error).toContain("Title is required.")
    expect(result.error).toContain("Priority must be one of:")
    expect(result.error).toContain("Column must be one of:")
  })

  it("rejects title longer than 120 and description longer than 2000", () => {
    const result = parseTicketCreateInput({
      title: "x".repeat(121),
      description: "y".repeat(2001),
      priority: "low",
      column: "done",
    })

    expect(result).toHaveProperty("error")
    if (!("error" in result)) throw new Error("expected validation error")
    expect(result.error).toContain("Title must be at most 120 characters.")
    expect(result.error).toContain(
      "Description must be at most 2000 characters.",
    )
  })

  it("requires missing create fields with clear messages", () => {
    const result = parseTicketCreateInput({})

    expect(result).toHaveProperty("error")
    if (!("error" in result)) throw new Error("expected validation error")
    expect(result.error).toContain("Title is required (--title).")
  })
})

describe("parseTicketUpdateInput", () => {
  it("accepts a partial update", () => {
    const result = parseTicketUpdateInput({ title: "Updated title" })
    expect(result).toEqual({ title: "Updated title" })
  })

  it("rejects an empty update", () => {
    const result = parseTicketUpdateInput({})
    expect(result).toHaveProperty("error")
    if (!("error" in result)) throw new Error("expected validation error")
    expect(result.error).toContain("Provide at least one field to update")
  })

  it("rejects invalid priority in a partial update", () => {
    const result = parseTicketUpdateInput({ priority: "critical" })
    expect(result).toHaveProperty("error")
    if (!("error" in result)) throw new Error("expected validation error")
    expect(result.error).toContain("Priority must be one of:")
  })
})

describe("parseTicketMoveInput", () => {
  it("accepts a valid move", () => {
    expect(
      parseTicketMoveInput({ id: "ticket1", column: "in_progress" }),
    ).toEqual({ id: "ticket1", column: "in_progress" })
  })

  it("rejects empty id and invalid column", () => {
    const result = parseTicketMoveInput({ id: "  ", column: "nope" })
    expect(result).toHaveProperty("error")
    if (!("error" in result)) throw new Error("expected validation error")
    expect(result.error).toContain("Ticket id is required.")
    expect(result.error).toContain("Column must be one of:")
  })
})

describe("parseColumnId / parsePriority", () => {
  it("accepts valid enums", () => {
    expect(parseColumnId("review")).toBe("review")
    expect(parsePriority("low")).toBe("low")
  })

  it("rejects invalid enums", () => {
    const column = parseColumnId("blocked")
    expect(column).toHaveProperty("error")
    if (!("error" in column)) throw new Error("expected validation error")
    expect(column.error).toContain("Column must be one of:")

    const priority = parsePriority("medium")
    expect(priority).toHaveProperty("error")
    if (!("error" in priority)) throw new Error("expected validation error")
    expect(priority.error).toContain("Priority must be one of:")
  })
})

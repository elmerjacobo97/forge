import { describe, expect, it } from "vitest";
import {
  parseColumnId,
  parsePriority,
  parseTicketCommentInput,
  parseTicketCreateInput,
  parseTicketMoveInput,
  parseTicketReportInput,
  parseTicketUpdateInput,
} from "../../src/ticket-schema.js";

describe("parseTicketCreateInput", () => {
  it("accepts a valid ticket payload", () => {
    const result = parseTicketCreateInput({
      projectId: "proj1",
      title: "Ship CLI tickets",
      description: "CRUD + move",
      priority: "med",
      column: "backlog",
    });

    expect(result).toEqual({
      projectId: "proj1",
      title: "Ship CLI tickets",
      description: "CRUD + move",
      priority: "med",
      column: "backlog",
    });
  });

  it("accepts empty description and trims title and projectId", () => {
    const result = parseTicketCreateInput({
      projectId: "  proj1  ",
      title: "  Fix bug  ",
      description: "",
      priority: "high",
      column: "todo",
    });

    expect(result).toEqual({
      projectId: "proj1",
      title: "Fix bug",
      description: "",
      priority: "high",
      column: "todo",
    });
  });

  it("rejects empty title, unknown priority, and invalid column", () => {
    const result = parseTicketCreateInput({
      projectId: "proj1",
      title: "   ",
      description: "ok",
      priority: "urgent",
      column: "archive",
    });

    expect(result).toHaveProperty("error");
    if (!("error" in result)) throw new Error("expected validation error");
    expect(result.error).toContain("Title is required.");
    expect(result.error).toContain("Priority must be one of:");
    expect(result.error).toContain("Column must be one of:");
  });

  it("rejects title longer than 120 and description longer than 2000", () => {
    const result = parseTicketCreateInput({
      projectId: "proj1",
      title: "x".repeat(121),
      description: "y".repeat(2001),
      priority: "low",
      column: "done",
    });

    expect(result).toHaveProperty("error");
    if (!("error" in result)) throw new Error("expected validation error");
    expect(result.error).toContain("Title must be at most 120 characters.");
    expect(result.error).toContain("Description must be at most 2000 characters.");
  });

  it("requires project id and title with clear messages", () => {
    const result = parseTicketCreateInput({});

    expect(result).toHaveProperty("error");
    if (!("error" in result)) throw new Error("expected validation error");
    expect(result.error).toContain("Project id is required (--project-id).");
    expect(result.error).toContain("Title is required (--title).");
  });

  it("rejects empty project id", () => {
    const result = parseTicketCreateInput({
      projectId: "   ",
      title: "Ship",
      description: "",
      priority: "med",
      column: "backlog",
    });

    expect(result).toHaveProperty("error");
    if (!("error" in result)) throw new Error("expected validation error");
    expect(result.error).toContain("Project id is required (--project-id).");
  });
});

describe("parseTicketUpdateInput", () => {
  it("accepts a partial update", () => {
    const result = parseTicketUpdateInput({ title: "Updated title" });
    expect(result).toEqual({ title: "Updated title" });
  });

  it("rejects an empty update", () => {
    const result = parseTicketUpdateInput({});
    expect(result).toHaveProperty("error");
    if (!("error" in result)) throw new Error("expected validation error");
    expect(result.error).toContain("Provide at least one field to update");
  });

  it("rejects invalid priority in a partial update", () => {
    const result = parseTicketUpdateInput({ priority: "critical" });
    expect(result).toHaveProperty("error");
    if (!("error" in result)) throw new Error("expected validation error");
    expect(result.error).toContain("Priority must be one of:");
  });
});

describe("parseTicketMoveInput", () => {
  it("accepts a valid move", () => {
    expect(parseTicketMoveInput({ id: "ticket1", column: "in_progress" })).toEqual({
      id: "ticket1",
      column: "in_progress",
    });
    expect(parseTicketMoveInput({ id: "ticket1", column: "validation" })).toEqual({
      id: "ticket1",
      column: "validation",
    });
  });

  it("rejects empty id and invalid column", () => {
    const result = parseTicketMoveInput({ id: "  ", column: "nope" });
    expect(result).toHaveProperty("error");
    if (!("error" in result)) throw new Error("expected validation error");
    expect(result.error).toContain("Ticket id is required.");
    expect(result.error).toContain("Column must be one of:");
  });
});

describe("ticket handoff fields", () => {
  it("accepts branch and prUrl in update and move", () => {
    expect(
      parseTicketUpdateInput({
        branch: "spec-17-agent-ticket-loop",
        prUrl: "https://github.com/acme/forge/pull/17",
      }),
    ).toEqual({
      branch: "spec-17-agent-ticket-loop",
      prUrl: "https://github.com/acme/forge/pull/17",
    });

    expect(
      parseTicketMoveInput({
        id: "ticket1",
        column: "review",
        branch: "spec-17-agent-ticket-loop",
        prUrl: "http://example.com/pr/1",
      }),
    ).toEqual({
      id: "ticket1",
      column: "review",
      branch: "spec-17-agent-ticket-loop",
      prUrl: "http://example.com/pr/1",
    });
  });

  it("accepts the clear flags on their own", () => {
    expect(parseTicketUpdateInput({ clearBranch: true, clearPrUrl: true })).toEqual({
      clearBranch: true,
      clearPrUrl: true,
    });

    expect(
      parseTicketMoveInput({
        id: "ticket1",
        column: "review",
        clearBranch: true,
      }),
    ).toEqual({ id: "ticket1", column: "review", clearBranch: true });
  });

  it("trims branch and prUrl values", () => {
    expect(
      parseTicketUpdateInput({
        branch: "  dev/handoff  ",
        prUrl: "  https://example.com/pr/2  ",
      }),
    ).toEqual({
      branch: "dev/handoff",
      prUrl: "https://example.com/pr/2",
    });
  });

  it("rejects empty and oversized branch values", () => {
    const empty = parseTicketUpdateInput({ branch: "   " });
    expect(empty).toHaveProperty("error");
    if (!("error" in empty)) throw new Error("expected validation error");
    expect(empty.error).toContain("Branch must be at least 1 character.");

    const long = parseTicketMoveInput({
      id: "ticket1",
      column: "review",
      branch: "x".repeat(201),
    });
    expect(long).toHaveProperty("error");
    if (!("error" in long)) throw new Error("expected validation error");
    expect(long.error).toContain("Branch must be at most 200 characters.");
  });

  it("rejects non-http prUrl and prUrl over 2048 characters", () => {
    const invalid = parseTicketUpdateInput({ prUrl: "ftp://example.com/pr/1" });
    expect(invalid).toHaveProperty("error");
    if (!("error" in invalid)) throw new Error("expected validation error");
    expect(invalid.error).toContain("PR URL must start with http:// or https://.");

    const long = parseTicketUpdateInput({
      prUrl: `https://example.com/${"x".repeat(2049)}`,
    });
    expect(long).toHaveProperty("error");
    if (!("error" in long)) throw new Error("expected validation error");
    expect(long.error).toContain("PR URL must be at most 2048 characters.");
  });

  it("keeps rejecting an empty update", () => {
    const result = parseTicketUpdateInput({});
    expect(result).toHaveProperty("error");
    if (!("error" in result)) throw new Error("expected validation error");
    expect(result.error).toContain("Provide at least one field to update");
  });
});

describe("parseTicketCommentInput", () => {
  it("accepts a body and defaults author to user", () => {
    expect(parseTicketCommentInput({ body: "Ready for review" })).toEqual({
      body: "Ready for review",
      author: "user",
    });
  });

  it("accepts an explicit agent author and trims the body", () => {
    expect(parseTicketCommentInput({ body: "  Handoff complete  ", author: "agent" })).toEqual({
      body: "Handoff complete",
      author: "agent",
    });
  });

  it("rejects a missing body, invalid author, and body over 5000", () => {
    const missing = parseTicketCommentInput({});
    expect(missing).toHaveProperty("error");
    if (!("error" in missing)) throw new Error("expected validation error");
    expect(missing.error).toContain("Comment body is required (--body).");

    const author = parseTicketCommentInput({ body: "hi", author: "bot" });
    expect(author).toHaveProperty("error");
    if (!("error" in author)) throw new Error("expected validation error");
    expect(author.error).toContain("Author must be one of:");

    const long = parseTicketCommentInput({ body: "x".repeat(5001) });
    expect(long).toHaveProperty("error");
    if (!("error" in long)) throw new Error("expected validation error");
    expect(long.error).toContain("Comment body must be at most 5000 characters.");
  });
});

describe("parseTicketReportInput", () => {
  it("defaults to a 7-day rolling window", () => {
    expect(parseTicketReportInput({})).toEqual({ days: 7 });
  });

  it("coerces days and passes through window options", () => {
    expect(
      parseTicketReportInput({
        days: "14",
        since: "2026-09-01T00:00:00Z",
        until: "2026-09-08T00:00:00Z",
        projectId: "proj1",
        columns: ["review", "done"],
      }),
    ).toEqual({
      days: 14,
      since: "2026-09-01T00:00:00Z",
      until: "2026-09-08T00:00:00Z",
      projectId: "proj1",
      columns: ["review", "done"],
    });
  });

  it("rejects invalid days, dates, and unknown columns", () => {
    for (const days of ["0", "91", "abc", "1.5"]) {
      const result = parseTicketReportInput({ days });
      expect(result).toHaveProperty("error");
      if (!("error" in result)) throw new Error("expected validation error");
      expect(result.error).toContain("Days");
    }

    const date = parseTicketReportInput({ days: "7", since: "not-a-date" });
    expect(date).toHaveProperty("error");
    if (!("error" in date)) throw new Error("expected validation error");
    expect(date.error).toContain("Date must be a valid ISO 8601 timestamp.");

    const column = parseTicketReportInput({ days: "7", columns: ["blocked"] });
    expect(column).toHaveProperty("error");
    if (!("error" in column)) throw new Error("expected validation error");
    expect(column.error).toContain("Column must be one of:");
  });

  it("rejects --since later than --until", () => {
    const result = parseTicketReportInput({
      days: "7",
      since: "2026-09-08T00:00:00Z",
      until: "2026-09-01T00:00:00Z",
    });

    expect(result).toHaveProperty("error");
    if (!("error" in result)) throw new Error("expected validation error");
    expect(result.error).toContain("--since must be earlier than --until.");
  });

  it("rejects an empty project id", () => {
    const result = parseTicketReportInput({ days: "7", projectId: "   " });
    expect(result).toHaveProperty("error");
    if (!("error" in result)) throw new Error("expected validation error");
    expect(result.error).toContain("Project id must not be empty.");
  });
});

describe("parseColumnId / parsePriority", () => {
  it("accepts valid enums", () => {
    expect(parseColumnId("review")).toBe("review");
    expect(parsePriority("low")).toBe("low");
  });

  it("rejects invalid enums", () => {
    const column = parseColumnId("blocked");
    expect(column).toHaveProperty("error");
    if (typeof column !== "object" || !("error" in column)) {
      throw new Error("expected validation error");
    }
    expect(column.error).toContain("Column must be one of:");

    const priority = parsePriority("medium");
    expect(priority).toHaveProperty("error");
    if (typeof priority !== "object" || !("error" in priority)) {
      throw new Error("expected validation error");
    }
    expect(priority.error).toContain("Priority must be one of:");
  });
});

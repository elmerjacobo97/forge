import { describe, expect, it } from "vitest";
import { z } from "zod";
import {
  activityReportInput,
  addTicketCommentInput,
  createTicketInput,
  getProjectInput,
  getTicketInput,
  listTicketsInput,
  moveTicketInput,
  nextTicketInput,
  ticketIdInput,
  updateTicketInput,
} from "../src/tool-schemas.js";

describe("activityReportInput", () => {
  const schema = z.object(activityReportInput);

  it("defaults the window to 7 days", () => {
    const parsed = schema.safeParse({});
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.days).toBe(7);
  });

  it("accepts optional filters", () => {
    const parsed = schema.safeParse({
      days: 30,
      since: "2026-09-01T00:00:00.000Z",
      until: "2026-09-10T00:00:00.000Z",
      projectId: "p1",
      columns: ["todo", "done"],
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects out-of-range days, empty project ids, and unknown columns", () => {
    expect(schema.safeParse({ days: 0 }).success).toBe(false);
    expect(schema.safeParse({ days: 91 }).success).toBe(false);
    expect(schema.safeParse({ projectId: "" }).success).toBe(false);
    expect(schema.safeParse({ columns: ["nope"] }).success).toBe(false);
    expect(schema.safeParse({ since: "not-a-date" }).success).toBe(false);
  });
});

describe("project and ticket inputs", () => {
  it("require ids on the single-resource tools", () => {
    expect(z.object(getProjectInput).safeParse({}).success).toBe(false);
    expect(z.object(getTicketInput).safeParse({ ticketId: "" }).success).toBe(false);
    expect(z.object(getTicketInput).safeParse({ ticketId: "t1" }).success).toBe(true);
  });

  it("keeps the project scope optional for next and report", () => {
    expect(z.object(nextTicketInput).safeParse({}).success).toBe(true);
  });

  it("validates pause and resume ticket ids", () => {
    expect(z.object(ticketIdInput).safeParse({}).success).toBe(false);
    expect(z.object(ticketIdInput).safeParse({ ticketId: "t1" }).success).toBe(true);
  });

  it("validates the ticket column", () => {
    expect(z.object(listTicketsInput).safeParse({ projectId: "p1" }).success).toBe(true);
    expect(
      z.object(listTicketsInput).safeParse({ projectId: "p1", column: "in_progress" }).success,
    ).toBe(true);
    expect(z.object(listTicketsInput).safeParse({ projectId: "p1", column: "nope" }).success).toBe(
      false,
    );
  });
});

describe("ticket write inputs", () => {
  it("accepts a valid create, move, update, and comment", () => {
    expect(
      z.object(createTicketInput).safeParse({
        projectId: "p1",
        title: "Ship MCP writes",
        description: "notes",
        column: "todo",
        priority: "high",
      }).success,
    ).toBe(true);
    expect(
      z.object(moveTicketInput).safeParse({
        ticketId: "t1",
        column: "in_progress",
        branch: "feat/mcp",
        prUrl: "https://github.com/org/repo/pull/1",
        clearBranch: false,
        clearPrUrl: true,
      }).success,
    ).toBe(true);
    expect(updateTicketInput.safeParse({ ticketId: "t1", clearBranch: true }).success).toBe(true);
    expect(
      z.object(addTicketCommentInput).safeParse({ ticketId: "t1", body: "done" }).success,
    ).toBe(true);
  });

  it("defaults create description, column, and priority", () => {
    const parsed = z.object(createTicketInput).safeParse({ projectId: "p1", title: "Ship it" });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.description).toBe("");
      expect(parsed.data.column).toBe("backlog");
      expect(parsed.data.priority).toBe("med");
    }
  });

  it("rejects invalid column, priority, prUrl, and body", () => {
    expect(
      z.object(createTicketInput).safeParse({ projectId: "p1", title: "Ship it", column: "nope" })
        .success,
    ).toBe(false);
    expect(
      z
        .object(createTicketInput)
        .safeParse({ projectId: "p1", title: "Ship it", priority: "urgent" }).success,
    ).toBe(false);
    expect(
      z.object(moveTicketInput).safeParse({ ticketId: "t1", column: "todo", prUrl: "ftp://nope" })
        .success,
    ).toBe(false);
    expect(z.object(addTicketCommentInput).safeParse({ ticketId: "t1", body: "" }).success).toBe(
      false,
    );
    expect(
      z.object(addTicketCommentInput).safeParse({ ticketId: "t1", body: "x".repeat(5001) }).success,
    ).toBe(false);
  });

  it("rejects an update with no handoff field and rejects title, description, and priority", () => {
    expect(updateTicketInput.safeParse({ ticketId: "t1" }).success).toBe(false);
    expect(updateTicketInput.safeParse({ ticketId: "t1", title: "Renamed" }).success).toBe(false);
    expect(updateTicketInput.safeParse({ ticketId: "t1", description: "notes" }).success).toBe(
      false,
    );
    expect(updateTicketInput.safeParse({ ticketId: "t1", priority: "high" }).success).toBe(false);
  });
});

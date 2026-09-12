import { describe, expect, it } from "vitest";
import { z } from "zod";
import {
  activityReportInput,
  getProjectInput,
  getTicketInput,
  listTicketsInput,
  nextTicketInput,
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

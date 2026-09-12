import { describe, expect, it } from "vitest";

import {
  ticketCommentSchema,
  ticketInputSchema,
  ticketSchema,
  ticketTimeAdjustSchema,
} from "./ticket";

const base = {
  title: "Ship CLI tickets",
  description: "",
  priority: "med" as const,
  branch: null,
  prUrl: null,
};

const inputRow = {
  id: "d7f1ce67-cf72-4f8e-8545-f0d2fb4ec501",
  projectId: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
  title: "Ship CLI tickets",
  description: "",
  column: "todo",
  position: 0,
  priority: "med",
  createdAt: "2026-09-01T00:00:00.000Z",
  timerStartedAt: null,
  totalElapsedMs: 0,
  isPaused: false,
  lastMovedAt: "2026-09-01T00:00:00.000Z",
  branch: null,
  prUrl: null,
};

describe("ticketSchema handoff fields", () => {
  it("normalizes blank branch and PR URL to null", () => {
    const parsed = ticketSchema.parse({ ...base, branch: "   ", prUrl: "" });

    expect(parsed.branch).toBeNull();
    expect(parsed.prUrl).toBeNull();
  });

  it("trims branch and keeps valid http(s) PR URLs", () => {
    const parsed = ticketSchema.parse({
      ...base,
      branch: "  dev/handoff  ",
      prUrl: "https://github.com/acme/forge/pull/17",
    });

    expect(parsed.branch).toBe("dev/handoff");
    expect(parsed.prUrl).toBe("https://github.com/acme/forge/pull/17");
  });

  it("rejects non-http PR URLs, oversized PR URLs, and oversized branches", () => {
    expect(ticketSchema.safeParse({ ...base, prUrl: "ftp://example.com/pr/1" }).success).toBe(
      false,
    );
    expect(
      ticketSchema.safeParse({ ...base, prUrl: `https://example.com/${"x".repeat(2049)}` }).success,
    ).toBe(false);
    expect(ticketSchema.safeParse({ ...base, branch: "x".repeat(201) }).success).toBe(false);
  });
});

describe("ticketCommentSchema", () => {
  it("trims and accepts a body", () => {
    expect(ticketCommentSchema.parse({ body: "  Handoff notes  " })).toEqual({
      body: "Handoff notes",
    });
  });

  it("rejects empty and oversized bodies", () => {
    expect(ticketCommentSchema.safeParse({ body: "   " }).success).toBe(false);
    expect(ticketCommentSchema.safeParse({ body: "x".repeat(5001) }).success).toBe(false);
  });
});

describe("ticketInputSchema handoff fields", () => {
  it("accepts null and valid handoff values", () => {
    expect(ticketInputSchema.safeParse(inputRow).success).toBe(true);
    expect(
      ticketInputSchema.safeParse({
        ...inputRow,
        branch: "dev/handoff",
        prUrl: "https://github.com/acme/forge/pull/17",
      }).success,
    ).toBe(true);
  });

  it("rejects invalid handoff values", () => {
    expect(ticketInputSchema.safeParse({ ...inputRow, branch: "" }).success).toBe(false);
    expect(ticketInputSchema.safeParse({ ...inputRow, prUrl: "not-a-url" }).success).toBe(false);
    expect(ticketInputSchema.safeParse({ ...inputRow, prUrl: "https://example.com" }).success).toBe(
      true,
    );
  });
});

describe("ticketTimeAdjustSchema", () => {
  const adjustBase = { ticketId: "d7f1ce67-cf72-4f8e-8545-f0d2fb4ec501" };

  it("accepts each supported action", () => {
    expect(
      ticketTimeAdjustSchema.safeParse({
        ...adjustBase,
        action: "stop_at",
        endedAt: "2026-09-12T20:00:00.000Z",
      }).success,
    ).toBe(true);
    expect(
      ticketTimeAdjustSchema.safeParse({
        ...adjustBase,
        action: "set_last_duration",
        durationMs: 3_600_000,
      }).success,
    ).toBe(true);
    expect(ticketTimeAdjustSchema.safeParse({ ...adjustBase, action: "delete_last" }).success).toBe(
      true,
    );
    expect(
      ticketTimeAdjustSchema.safeParse({ ...adjustBase, action: "set_total", durationMs: 0 })
        .success,
    ).toBe(true);
  });

  it("rejects invalid ids, datetimes, durations and actions", () => {
    expect(
      ticketTimeAdjustSchema.safeParse({ ticketId: "nope", action: "delete_last" }).success,
    ).toBe(false);
    expect(
      ticketTimeAdjustSchema.safeParse({ ...adjustBase, action: "stop_at", endedAt: "yesterday" })
        .success,
    ).toBe(false);
    expect(ticketTimeAdjustSchema.safeParse({ ...adjustBase, action: "stop_at" }).success).toBe(
      false,
    );
    expect(
      ticketTimeAdjustSchema.safeParse({
        ...adjustBase,
        action: "set_last_duration",
        durationMs: -1,
      }).success,
    ).toBe(false);
    expect(
      ticketTimeAdjustSchema.safeParse({
        ...adjustBase,
        action: "set_last_duration",
        durationMs: 1.5,
      }).success,
    ).toBe(false);
    expect(ticketTimeAdjustSchema.safeParse({ ...adjustBase, action: "unknown" }).success).toBe(
      false,
    );
  });
});

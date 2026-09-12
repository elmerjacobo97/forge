import { afterEach, describe, expect, it, vi } from "vitest";

import type { Ticket } from "../types/board";
import { adjustmentAddsComment, moveTicket } from "./tickets";

afterEach(() => vi.useRealTimers());

function ticket(id: string, column: Ticket["column"], position: number): Ticket {
  return {
    id,
    projectId: "project-1",
    title: id,
    description: "",
    column,
    position,
    priority: "med",
    createdAt: "2026-07-11T15:00:00.000Z",
    timerStartedAt: null,
    totalElapsedMs: 0,
    isPaused: false,
    lastMovedAt: "2026-07-11T15:00:00.000Z",
    branch: null,
    prUrl: null,
  };
}

describe("moveTicket", () => {
  it("places a dropped ticket between its visible neighbours", () => {
    const first = ticket("first", "todo", 100);
    const middle = ticket("middle", "todo", 50);
    const moving = ticket("moving", "todo", 0);

    const moved = moveTicket(moving, "todo", [first, middle, moving], "middle", false);

    expect(moved.position).toBe(75);
    expect(moved.lastMovedAt).toBe(moving.lastMovedAt);
  });

  it("starts timer and updates stale timestamp when entering In Progress", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-11T15:05:00.000Z"));
    const moving = ticket("moving", "todo", 0);

    const moved = moveTicket(moving, "in_progress", [moving], null, true);

    expect(moved).toMatchObject({
      column: "in_progress",
      timerStartedAt: "2026-07-11T15:05:00.000Z",
      lastMovedAt: "2026-07-11T15:05:00.000Z",
    });
  });

  it("starts the timer when entering Validation from To Do", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-11T15:06:00.000Z"));
    const moving = ticket("moving", "todo", 0);

    const moved = moveTicket(moving, "validation", [moving], null, true);

    expect(moved).toMatchObject({
      column: "validation",
      timerStartedAt: "2026-07-11T15:06:00.000Z",
    });
  });

  it("keeps the timer between In Progress and Validation and stops it at Review", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-11T15:10:00.000Z"));
    const running = ticket("moving", "in_progress", 0);
    running.timerStartedAt = "2026-07-11T15:00:00.000Z";

    const toValidation = moveTicket(running, "validation", [running], null, true);

    expect(toValidation).toMatchObject({
      column: "validation",
      timerStartedAt: "2026-07-11T15:00:00.000Z",
      totalElapsedMs: 0,
    });

    vi.setSystemTime(new Date("2026-07-11T15:20:00.000Z"));
    const toReview = moveTicket(toValidation, "review", [toValidation], null, true);

    expect(toReview).toMatchObject({
      column: "review",
      timerStartedAt: null,
      totalElapsedMs: 20 * 60_000,
    });
  });
});

describe("adjustmentAddsComment", () => {
  it("always comments on session edits and removals", () => {
    expect(
      adjustmentAddsComment({ ticketId: "ticket-1", action: "set_last_duration", durationMs: 0 }),
    ).toBe(true);
    expect(adjustmentAddsComment({ ticketId: "ticket-1", action: "delete_last" })).toBe(true);
    expect(
      adjustmentAddsComment({ ticketId: "ticket-1", action: "set_total", durationMs: 3_600_000 }),
    ).toBe(true);
  });

  it("comments on retro stops but not on stopping at now", () => {
    const now = Date.parse("2026-09-12T20:00:00.000Z");

    expect(
      adjustmentAddsComment(
        { ticketId: "ticket-1", action: "stop_at", endedAt: "2026-09-12T18:00:00.000Z" },
        now,
      ),
    ).toBe(true);
    expect(
      adjustmentAddsComment(
        { ticketId: "ticket-1", action: "stop_at", endedAt: "2026-09-12T19:59:30.000Z" },
        now,
      ),
    ).toBe(false);
  });
});

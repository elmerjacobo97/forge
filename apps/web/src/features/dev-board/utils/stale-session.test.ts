import { describe, expect, it } from "vitest";

import type { Ticket } from "../types/board";
import { isStaleSession, runningSessionMs, staleSessionMsForMove } from "./stale-session";

const NOW = Date.parse("2026-09-12T12:00:00.000Z");
const TWO_HOURS = 7_200_000;

function startedAgo(ms: number): string {
  return new Date(NOW - ms).toISOString();
}

function makeTicket(overrides: Partial<Ticket> = {}): Ticket {
  return {
    id: "ticket-1",
    projectId: "project-1",
    title: "Stale session",
    description: "",
    column: "in_progress",
    position: 0,
    priority: "med",
    createdAt: startedAgo(TWO_HOURS),
    timerStartedAt: startedAgo(TWO_HOURS),
    totalElapsedMs: 0,
    isPaused: false,
    lastMovedAt: startedAgo(TWO_HOURS),
    branch: null,
    prUrl: null,
    ...overrides,
  };
}

describe("runningSessionMs", () => {
  it("returns the running session length", () => {
    expect(runningSessionMs(makeTicket(), NOW)).toBe(TWO_HOURS);
  });

  it("adds previously logged time of the same session", () => {
    const ticket = makeTicket({ totalElapsedMs: 3_600_000 });

    expect(runningSessionMs(ticket, NOW)).toBe(3 * 3_600_000);
  });

  it("returns null when paused, stopped or outside a timer column", () => {
    expect(runningSessionMs(makeTicket({ isPaused: true }), NOW)).toBeNull();
    expect(runningSessionMs(makeTicket({ timerStartedAt: null }), NOW)).toBeNull();
    expect(runningSessionMs(makeTicket({ column: "review" }), NOW)).toBeNull();
  });
});

describe("isStaleSession", () => {
  it("marks sessions above the two hour threshold as stale", () => {
    expect(isStaleSession(makeTicket({ timerStartedAt: startedAgo(TWO_HOURS + 1) }), NOW)).toBe(
      true,
    );
    expect(isStaleSession(makeTicket({ timerStartedAt: startedAgo(3 * 3_600_000) }), NOW)).toBe(
      true,
    );
  });

  it("does not mark exactly two hours or less as stale", () => {
    expect(isStaleSession(makeTicket(), NOW)).toBe(false);
    expect(isStaleSession(makeTicket({ timerStartedAt: startedAgo(3_600_000) }), NOW)).toBe(false);
  });
});

describe("staleSessionMsForMove", () => {
  it("returns the session length when leaving a timer column above the threshold", () => {
    const ticket = makeTicket({ column: "validation", timerStartedAt: startedAgo(3 * 3_600_000) });

    expect(staleSessionMsForMove(ticket, "review", NOW)).toBe(3 * 3_600_000);
    expect(staleSessionMsForMove(ticket, "done", NOW)).toBe(3 * 3_600_000);
  });

  it("returns null when the move stays within timer columns", () => {
    const ticket = makeTicket({ timerStartedAt: startedAgo(3 * 3_600_000) });

    expect(staleSessionMsForMove(ticket, "validation", NOW)).toBeNull();
  });

  it("returns null for sessions at or below the threshold", () => {
    expect(staleSessionMsForMove(makeTicket(), "review", NOW)).toBeNull();
    expect(
      staleSessionMsForMove(
        makeTicket({ timerStartedAt: startedAgo(TWO_HOURS + 1) }),
        "review",
        NOW,
      ),
    ).not.toBeNull();
  });

  it("returns null when the timer is not running", () => {
    expect(staleSessionMsForMove(makeTicket({ isPaused: true }), "review", NOW)).toBeNull();
    expect(staleSessionMsForMove(makeTicket({ timerStartedAt: null }), "review", NOW)).toBeNull();
  });
});

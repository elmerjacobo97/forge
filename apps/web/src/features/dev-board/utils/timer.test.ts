import { afterEach, describe, expect, it, vi } from "vitest";

import type { Ticket } from "../types/board";
import {
  computeElapsed,
  durationMsFromParts,
  durationParts,
  endTimeFromDuration,
  pauseTimer,
  resumeTimer,
  runningSegmentMs,
  startTimer,
  stopTimer,
} from "./timer";

function createTicket(overrides: Partial<Ticket> = {}): Ticket {
  return {
    id: "ticket-1",
    projectId: "project-1",
    title: "Test ticket",
    description: "",
    column: "in_progress",
    position: 0,
    priority: "med",
    createdAt: "2026-07-11T15:00:00.000Z",
    timerStartedAt: null,
    totalElapsedMs: 0,
    isPaused: false,
    lastMovedAt: "2026-07-11T15:00:00.000Z",
    branch: null,
    prUrl: null,
    ...overrides,
  };
}

afterEach(() => vi.useRealTimers());

describe("ticket timer", () => {
  it("derives elapsed time from the saved start timestamp", () => {
    const ticket = createTicket({
      timerStartedAt: "2026-07-11T15:00:00.000Z",
      totalElapsedMs: 2_000,
    });

    expect(computeElapsed(ticket, Date.parse("2026-07-11T15:00:05.000Z"))).toBe(7_000);
  });

  it("persists elapsed time only when paused or stopped", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-11T15:00:00.000Z"));
    const running = startTimer(createTicket());

    vi.setSystemTime(new Date("2026-07-11T15:00:05.000Z"));
    const paused = pauseTimer(running);
    const resumed = resumeTimer(paused);

    expect(paused).toMatchObject({ timerStartedAt: null, totalElapsedMs: 5_000, isPaused: true });
    expect(resumed).toMatchObject({
      timerStartedAt: "2026-07-11T15:00:05.000Z",
      totalElapsedMs: 5_000,
      isPaused: false,
    });
    expect(stopTimer(resumed)).toMatchObject({
      timerStartedAt: null,
      totalElapsedMs: 5_000,
      isPaused: false,
    });
  });
});

describe("runningSegmentMs", () => {
  it("measures only the current run and ignores the saved total", () => {
    const ticket = createTicket({
      timerStartedAt: "2026-07-11T15:00:00.000Z",
      totalElapsedMs: 3_600_000,
    });

    expect(runningSegmentMs(ticket, Date.parse("2026-07-11T15:10:00.000Z"))).toBe(600_000);
  });

  it("returns null when the timer is not running", () => {
    expect(runningSegmentMs(createTicket(), Date.now())).toBeNull();
  });
});

describe("duration helpers", () => {
  it("splits milliseconds into hours and minutes", () => {
    expect(durationParts(3_600_000)).toEqual({ hours: 1, minutes: 0 });
    expect(durationParts(5_400_000)).toEqual({ hours: 1, minutes: 30 });
    expect(durationParts(14_700_000)).toEqual({ hours: 4, minutes: 5 });
    expect(durationParts(0)).toEqual({ hours: 0, minutes: 0 });
  });

  it("rounds to the nearest minute, normalizes overflow and clamps negatives", () => {
    expect(durationParts(59 * 60_000 + 31_000)).toEqual({ hours: 1, minutes: 0 });
    expect(durationParts(30_000)).toEqual({ hours: 0, minutes: 1 });
    expect(durationParts(-500)).toEqual({ hours: 0, minutes: 0 });
  });

  it("converts hours and minutes back to milliseconds", () => {
    expect(durationMsFromParts(1, 30)).toBe(5_400_000);
    expect(durationMsFromParts(0, 59)).toBe(3_540_000);
    expect(durationMsFromParts(0, 0)).toBe(0);
    expect(durationMsFromParts(-1, 20)).toBe(1_200_000);
  });

  it("computes the end time from a start and duration", () => {
    expect(endTimeFromDuration("2026-09-12T10:00:00.000Z", 5_400_000)).toBe(
      "2026-09-12T11:30:00.000Z",
    );
    expect(endTimeFromDuration("2026-09-12T10:00:00.000Z", -5)).toBe("2026-09-12T10:00:00.000Z");
  });
});

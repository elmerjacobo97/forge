import { afterEach, describe, expect, it, vi } from "vitest";

import type { Ticket } from "../types";
import { computeElapsed, pauseTimer, resumeTimer, startTimer, stopTimer } from "./timer";

function createTicket(overrides: Partial<Ticket> = {}): Ticket {
  return {
    id: "ticket-1",
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
    ...overrides,
  };
}

afterEach(() => vi.useRealTimers());

describe("ticket timer", () => {
  it("derives elapsed time from the saved start timestamp", () => {
    const ticket = createTicket({ timerStartedAt: "2026-07-11T15:00:00.000Z", totalElapsedMs: 2_000 });

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
    expect(resumed).toMatchObject({ timerStartedAt: "2026-07-11T15:00:05.000Z", totalElapsedMs: 5_000, isPaused: false });
    expect(stopTimer(resumed)).toMatchObject({ timerStartedAt: null, totalElapsedMs: 5_000, isPaused: false });
  });
});

import { afterEach, describe, expect, it, vi } from "vitest";

import type { Ticket } from "../types/board";
import { moveTicket } from "../utils/tickets";

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
});

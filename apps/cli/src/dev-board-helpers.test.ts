import { afterEach, describe, expect, it, vi } from "vitest"
import {
  applyMoveTicket,
  positionAtEnd,
  resolveUpdateEventType,
  startTimer,
  stopTimer,
} from "./dev-board-helpers.js"
import type { Ticket } from "./types.js"

afterEach(() => vi.useRealTimers())

function ticket(
  id: string,
  column: Ticket["column"],
  position: number,
  overrides: Partial<Ticket> = {},
): Ticket {
  return {
    id,
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
    ...overrides,
  }
}

describe("positionAtEnd", () => {
  it("returns 0 for an empty column", () => {
    expect(positionAtEnd([])).toBe(0)
  })

  it("places after the lowest position when sorted desc", () => {
    const column = [ticket("a", "todo", 100), ticket("b", "todo", 50)].sort(
      (a, b) => b.position - a.position,
    )
    expect(positionAtEnd(column)).toBe(50 - 1024)
  })
})

describe("startTimer / stopTimer", () => {
  it("starts a stopped ticket and accumulates elapsed on stop", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-07-11T15:00:00.000Z"))

    const started = startTimer(ticket("t1", "in_progress", 0))
    expect(started.timerStartedAt).toBe("2026-07-11T15:00:00.000Z")

    vi.setSystemTime(new Date("2026-07-11T15:00:10.000Z"))
    const stopped = stopTimer(started)
    expect(stopped).toMatchObject({
      timerStartedAt: null,
      totalElapsedMs: 10_000,
      isPaused: false,
    })
  })

  it("does not restart when already running or paused", () => {
    const running = ticket("t1", "in_progress", 0, {
      timerStartedAt: "2026-07-11T15:00:00.000Z",
    })
    expect(startTimer(running)).toBe(running)

    const paused = ticket("t2", "in_progress", 0, { isPaused: true })
    expect(startTimer(paused)).toBe(paused)
  })
})

describe("applyMoveTicket", () => {
  it("appends to the end of the destination column", () => {
    const first = ticket("first", "todo", 100)
    const second = ticket("second", "todo", 50)
    const moving = ticket("moving", "backlog", 0)

    const moved = applyMoveTicket(moving, "todo", [first, second, moving])

    expect(moved.column).toBe("todo")
    expect(moved.position).toBe(50 - 1024)
  })

  it("starts timer and updates lastMovedAt when entering in_progress", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-07-11T15:05:00.000Z"))
    const moving = ticket("moving", "todo", 0)

    const moved = applyMoveTicket(moving, "in_progress", [moving])

    expect(moved).toMatchObject({
      column: "in_progress",
      timerStartedAt: "2026-07-11T15:05:00.000Z",
      lastMovedAt: "2026-07-11T15:05:00.000Z",
    })
  })

  it("stops timer when leaving in_progress", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-07-11T15:00:00.000Z"))
    const moving = ticket("moving", "in_progress", 0, {
      timerStartedAt: "2026-07-11T14:59:00.000Z",
      totalElapsedMs: 1_000,
    })

    const moved = applyMoveTicket(moving, "review", [moving])

    expect(moved).toMatchObject({
      column: "review",
      timerStartedAt: null,
      totalElapsedMs: 1_000 + 60_000,
    })
  })

  it("keeps lastMovedAt when column is unchanged", () => {
    const moving = ticket("moving", "todo", 0)
    const peer = ticket("peer", "todo", 100)

    const moved = applyMoveTicket(moving, "todo", [peer, moving])

    expect(moved.lastMovedAt).toBe(moving.lastMovedAt)
    expect(moved.position).toBe(100 - 1024)
  })
})

describe("resolveUpdateEventType", () => {
  it("maps column changes to started / completed / moved", () => {
    const base = ticket("t1", "todo", 0)
    expect(
      resolveUpdateEventType(base, { ...base, column: "in_progress" }),
    ).toBe("started")
    expect(resolveUpdateEventType(base, { ...base, column: "done" })).toBe(
      "completed",
    )
    expect(resolveUpdateEventType(base, { ...base, column: "review" })).toBe(
      "moved",
    )
  })

  it("maps timer-only changes to paused / resumed", () => {
    const running = ticket("t1", "in_progress", 0, {
      timerStartedAt: "2026-07-11T15:00:00.000Z",
    })
    const stopped = { ...running, timerStartedAt: null }
    expect(resolveUpdateEventType(running, stopped)).toBe("paused")
    expect(resolveUpdateEventType(stopped, running)).toBe("resumed")
  })

  it("returns null when nothing timer/column related changed", () => {
    const base = ticket("t1", "todo", 0)
    expect(
      resolveUpdateEventType(base, { ...base, title: "Renamed" }),
    ).toBeNull()
  })
})

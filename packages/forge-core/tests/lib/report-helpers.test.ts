import { describe, expect, it } from "vitest";
import { groupActivity, resolveReportWindow } from "../../src/report-helpers.js";
import type { Ticket, TicketComment, TicketEvent } from "../../src/types.js";

function ticket(overrides: Partial<Ticket> = {}): Ticket {
  return {
    id: "t1",
    projectId: "p1",
    title: "Ticket",
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
    ...overrides,
  };
}

function event(overrides: Partial<TicketEvent> = {}): TicketEvent {
  return {
    id: "e1",
    ticketId: "t1",
    eventType: "moved",
    fromColumn: "todo",
    toColumn: "in_progress",
    occurredAt: "2026-09-08T10:00:00.000Z",
    ...overrides,
  };
}

function comment(overrides: Partial<TicketComment> = {}): TicketComment {
  return {
    id: "c1",
    ticketId: "t1",
    author: "agent",
    body: "Done",
    createdAt: "2026-09-08T11:00:00.000Z",
    ...overrides,
  };
}

const projects = [
  { id: "p1", name: "Forge" },
  { id: "p2", name: "Other" },
];

describe("resolveReportWindow", () => {
  it("defaults to a rolling window ending now", () => {
    const window = resolveReportWindow({
      days: 7,
      now: new Date("2026-09-11T21:00:00.000Z"),
    });

    expect(window).toEqual({
      from: "2026-09-04T21:00:00.000Z",
      to: "2026-09-11T21:00:00.000Z",
      days: 7,
    });
  });

  it("honors an explicit since and derives the day count", () => {
    const window = resolveReportWindow({
      days: 7,
      since: "2026-09-01T00:00:00.000Z",
      until: "2026-09-03T12:00:00.000Z",
    });

    expect(window.from).toBe("2026-09-01T00:00:00.000Z");
    expect(window.to).toBe("2026-09-03T12:00:00.000Z");
    expect(window.days).toBe(3);
  });
});

describe("groupActivity", () => {
  it("groups events and comments per ticket, newest activity first", () => {
    const groups = groupActivity({
      projects,
      tickets: [
        ticket({ id: "t1", column: "in_progress" }),
        ticket({ id: "t2", projectId: "p2", column: "done" }),
      ],
      events: [
        event({ id: "e1", ticketId: "t1", occurredAt: "2026-09-08T10:00:00.000Z" }),
        event({
          id: "e2",
          ticketId: "t2",
          toColumn: "done",
          occurredAt: "2026-09-09T12:00:00.000Z",
        }),
      ],
      comments: [comment({ id: "c1", ticketId: "t1" })],
    });

    expect(groups.map((group) => group.ticket.id)).toEqual(["t2", "t1"]);
    expect(groups[1].project).toEqual({ id: "p1", name: "Forge" });
    expect(groups[0].events).toHaveLength(1);
    expect(groups[1].comments[0].body).toBe("Done");
  });

  it("excludes backlog tickets and tickets without activity", () => {
    const groups = groupActivity({
      projects,
      tickets: [
        ticket({ id: "t1" }),
        ticket({ id: "t2", column: "backlog" }),
        ticket({ id: "t3", column: "todo" }),
      ],
      events: [event({ id: "e1", ticketId: "t1" }), event({ id: "e2", ticketId: "t2" })],
      comments: [],
    });

    expect(groups.map((group) => group.ticket.id)).toEqual(["t1"]);
  });

  it("filters by current column", () => {
    const groups = groupActivity({
      projects,
      tickets: [
        ticket({ id: "t1", column: "in_progress" }),
        ticket({ id: "t2", column: "review" }),
        ticket({ id: "t3", column: "done" }),
      ],
      events: [
        event({ id: "e1", ticketId: "t1" }),
        event({ id: "e2", ticketId: "t2" }),
        event({ id: "e3", ticketId: "t3" }),
      ],
      comments: [],
      columns: ["review", "done"],
    });

    expect(groups.map((group) => group.ticket.id)).toEqual(["t2", "t3"]);
  });

  it("ignores events and comments from unknown tickets", () => {
    const groups = groupActivity({
      projects,
      tickets: [ticket({ id: "t1" })],
      events: [event({ id: "e1", ticketId: "t1" }), event({ id: "e2", ticketId: "missing" })],
      comments: [comment({ id: "c1", ticketId: "missing" })],
    });

    expect(groups).toHaveLength(1);
    expect(groups[0].events.map((item) => item.id)).toEqual(["e1"]);
    expect(groups[0].comments).toEqual([]);
  });

  it("sorts events and comments ascending inside a group", () => {
    const groups = groupActivity({
      projects,
      tickets: [ticket({ id: "t1" })],
      events: [
        event({ id: "late", ticketId: "t1", occurredAt: "2026-09-08T12:00:00.000Z" }),
        event({ id: "early", ticketId: "t1", occurredAt: "2026-09-08T08:00:00.000Z" }),
      ],
      comments: [
        comment({ id: "c2", createdAt: "2026-09-08T13:00:00.000Z" }),
        comment({ id: "c1", createdAt: "2026-09-08T11:00:00.000Z" }),
      ],
    });

    expect(groups[0].events.map((item) => item.id)).toEqual(["early", "late"]);
    expect(groups[0].comments.map((item) => item.id)).toEqual(["c1", "c2"]);
  });
});

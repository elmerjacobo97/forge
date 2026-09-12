import { describe, expect, it } from "vitest";

import type { ColumnId, Ticket } from "../types/board";
import {
  appendTickets,
  columnTickets,
  incrementCommentCount,
  removeTicket,
  toColumnRecord,
  upsertTicket,
} from "./board-state";

function ticket(overrides: Partial<Ticket> & { id: string; column: ColumnId }): Ticket {
  return {
    projectId: "project-1",
    title: "Ticket",
    description: "",
    position: 1,
    priority: "med",
    createdAt: "2026-07-20T00:00:00.000Z",
    timerStartedAt: null,
    totalElapsedMs: 0,
    isPaused: false,
    lastMovedAt: "2026-07-20T00:00:00.000Z",
    branch: null,
    prUrl: null,
    ...overrides,
  };
}

describe("board-state", () => {
  it("builds a record with empty columns for missing pages", () => {
    const columns = toColumnRecord([
      {
        column: "backlog",
        tickets: [ticket({ id: "t1", column: "backlog" })],
        total: 1,
        nextCursor: null,
      },
    ]);

    expect(columns.backlog.total).toBe(1);
    expect(columns.done).toEqual({ column: "done", tickets: [], total: 0, nextCursor: null });
  });

  it("moves a ticket between columns and updates totals", () => {
    const columns = toColumnRecord([
      {
        column: "backlog",
        tickets: [ticket({ id: "t1", column: "backlog", position: 10 })],
        total: 1,
        nextCursor: null,
      },
      { column: "done", tickets: [], total: 0, nextCursor: null },
    ]);

    const moved = upsertTicket(columns, ticket({ id: "t1", column: "done", position: 5 }));

    expect(moved.backlog.tickets).toEqual([]);
    expect(moved.backlog.total).toBe(0);
    expect(moved.done.tickets.map((item) => item.id)).toEqual(["t1"]);
    expect(moved.done.total).toBe(1);
  });

  it("replaces a ticket in place without changing totals", () => {
    const columns = toColumnRecord([
      {
        column: "backlog",
        tickets: [ticket({ id: "t1", column: "backlog", position: 10 })],
        total: 1,
        nextCursor: null,
      },
    ]);

    const updated = upsertTicket(
      columns,
      ticket({ id: "t1", column: "backlog", position: 10, title: "Renamed" }),
    );

    expect(updated.backlog.total).toBe(1);
    expect(updated.backlog.tickets[0]?.title).toBe("Renamed");
  });

  it("removes a ticket and decrements the total", () => {
    const columns = toColumnRecord([
      {
        column: "todo",
        tickets: [ticket({ id: "t1", column: "todo" })],
        total: 1,
        nextCursor: null,
      },
    ]);

    const next = removeTicket(columns, ticket({ id: "t1", column: "todo" }));

    expect(next.todo.tickets).toEqual([]);
    expect(next.todo.total).toBe(0);
  });

  it("appends only unknown tickets with a new cursor", () => {
    const columns = toColumnRecord([
      {
        column: "backlog",
        tickets: [ticket({ id: "t1", column: "backlog" })],
        total: 3,
        nextCursor: "1",
      },
    ]);

    const next = appendTickets(
      columns,
      "backlog",
      [ticket({ id: "t1", column: "backlog" }), ticket({ id: "t2", column: "backlog" })],
      null,
      3,
    );

    expect(next.backlog.tickets.map((item) => item.id)).toEqual(["t1", "t2"]);
    expect(next.backlog.nextCursor).toBeNull();
  });

  it("preserves the previous comment count when the incoming ticket omits it", () => {
    const columns = toColumnRecord([
      {
        column: "backlog",
        tickets: [ticket({ id: "t1", column: "backlog", position: 10, commentCount: 3 })],
        total: 1,
        nextCursor: null,
      },
    ]);

    const updated = upsertTicket(
      columns,
      ticket({ id: "t1", column: "backlog", position: 10, title: "Renamed" }),
    );

    expect(updated.backlog.tickets[0]?.commentCount).toBe(3);
  });

  it("keeps an explicit incoming comment count over the previous one", () => {
    const columns = toColumnRecord([
      {
        column: "backlog",
        tickets: [ticket({ id: "t1", column: "backlog", position: 10, commentCount: 3 })],
        total: 1,
        nextCursor: null,
      },
    ]);

    const updated = upsertTicket(
      columns,
      ticket({ id: "t1", column: "backlog", position: 10, commentCount: 0 }),
    );

    expect(updated.backlog.tickets[0]?.commentCount).toBe(0);
  });

  it("preserves the comment count when a ticket moves columns", () => {
    const columns = toColumnRecord([
      {
        column: "todo",
        tickets: [ticket({ id: "t1", column: "todo", position: 10, commentCount: 2 })],
        total: 1,
        nextCursor: null,
      },
    ]);

    const moved = upsertTicket(columns, ticket({ id: "t1", column: "review", position: 5 }));

    expect(moved.review.tickets[0]?.commentCount).toBe(2);
  });

  it("increments a ticket comment count in place", () => {
    const columns = toColumnRecord([
      {
        column: "todo",
        tickets: [ticket({ id: "t1", column: "todo", commentCount: 2 })],
        total: 1,
        nextCursor: null,
      },
    ]);

    const next = incrementCommentCount(columns, "t1");

    expect(next.todo.tickets[0]?.commentCount).toBe(3);
    expect(next.todo.total).toBe(1);
  });

  it("increments from zero and ignores unknown tickets", () => {
    const columns = toColumnRecord([
      {
        column: "todo",
        tickets: [ticket({ id: "t1", column: "todo" })],
        total: 1,
        nextCursor: null,
      },
    ]);

    const next = incrementCommentCount(columns, "missing");

    expect(next.todo.tickets[0]?.commentCount).toBeUndefined();
    expect(incrementCommentCount(columns, "t1").todo.tickets[0]?.commentCount).toBe(1);
  });

  it("sorts flattened tickets by createdAt descending", () => {
    const columns = toColumnRecord([
      {
        column: "backlog",
        tickets: [ticket({ id: "t1", column: "backlog", createdAt: "2026-07-20T00:00:00.000Z" })],
        total: 1,
        nextCursor: null,
      },
      {
        column: "todo",
        tickets: [ticket({ id: "t2", column: "todo", createdAt: "2026-07-21T00:00:00.000Z" })],
        total: 1,
        nextCursor: null,
      },
    ]);

    expect(columnTickets(columns).map((item) => item.id)).toEqual(["t2", "t1"]);
  });

  it("sorts a column by createdAt descending on upsert", () => {
    const columns = toColumnRecord([
      {
        column: "backlog",
        tickets: [ticket({ id: "t1", column: "backlog", createdAt: "2026-07-20T00:00:00.000Z" })],
        total: 1,
        nextCursor: null,
      },
    ]);

    const next = upsertTicket(
      columns,
      ticket({ id: "t2", column: "backlog", createdAt: "2026-07-21T00:00:00.000Z" }),
    );

    expect(next.backlog.tickets.map((item) => item.id)).toEqual(["t2", "t1"]);
  });
});

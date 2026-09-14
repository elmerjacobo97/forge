import { describe, expect, it } from "vitest";

import { parseCommentChange, parseTicketChange } from "./board-realtime";

const row = {
  id: "t1",
  project_id: "project-1",
  title: "Ticket",
  description: "",
  column_id: "todo",
  position: 10,
  priority: "med",
  created_at: "2026-07-20T00:00:00.000Z",
  timer_started_at: null,
  total_elapsed_ms: 0,
  is_paused: false,
  last_moved_at: "2026-07-20T00:00:00.000Z",
  branch: null,
  pr_url: null,
};

describe("board-realtime", () => {
  it("maps a ticket event to a TicketChange", () => {
    const change = parseTicketChange({
      action: "update",
      from_column: "todo",
      ticket: row,
    });

    expect(change).toEqual({
      action: "update",
      fromColumn: "todo",
      ticket: {
        id: "t1",
        projectId: "project-1",
        title: "Ticket",
        description: "",
        column: "todo",
        position: 10,
        priority: "med",
        createdAt: "2026-07-20T00:00:00.000Z",
        timerStartedAt: null,
        totalElapsedMs: 0,
        isPaused: false,
        lastMovedAt: "2026-07-20T00:00:00.000Z",
        branch: null,
        prUrl: null,
      },
    });
  });

  it("defaults fromColumn to null when absent", () => {
    const change = parseTicketChange({ action: "insert", ticket: row });

    expect(change?.fromColumn).toBeNull();
  });

  it("rejects malformed ticket events", () => {
    expect(parseTicketChange({ action: "moved", ticket: row })).toBeNull();
    expect(parseTicketChange({ action: "update", ticket: { id: "t1" } })).toBeNull();
    expect(parseTicketChange(null)).toBeNull();
  });

  it("maps a comment event to its ticket id", () => {
    expect(
      parseCommentChange({ action: "insert", comment: { id: "c1", ticket_id: "t1" } }),
    ).toEqual({ ticketId: "t1" });
    expect(parseCommentChange({ action: "insert", comment: {} })).toBeNull();
  });
});

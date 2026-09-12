import { afterEach, describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";
import { DndContext } from "@dnd-kit/core";

import type { Ticket } from "../types/board";
import { ColumnView } from "./column-view";

function makeTicket(overrides: Partial<Ticket> = {}): Ticket {
  return {
    id: "ticket-1",
    projectId: "project-1",
    title: "Timer ticket",
    description: "",
    column: "in_progress",
    position: 0,
    priority: "med",
    createdAt: "2026-09-12T10:00:00.000Z",
    timerStartedAt: "2026-09-12T10:00:00.000Z",
    totalElapsedMs: 120_000,
    isPaused: false,
    lastMovedAt: "2026-09-12T10:00:00.000Z",
    branch: null,
    prUrl: null,
    ...overrides,
  };
}

const noop = () => {};

function timeLabel(markup: string): string {
  return markup.match(/>(\d+(?:\.\d+)?[mh])</)?.[1] ?? "";
}

function renderColumn(tickets: Ticket[]): string {
  return renderToString(
    <DndContext>
      <ColumnView
        columnId="in_progress"
        tickets={tickets}
        isHighlighted={false}
        onEdit={noop}
        onComments={noop}
        onAdjust={noop}
        onUpdate={noop}
        onDelete={noop}
        onMoveToColumn={noop}
        onAddTicket={noop}
        totalTickets={tickets.length}
        hasNextPage={false}
        isFetchingNextPage={false}
        onLoadMore={noop}
      />
    </DndContext>,
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ColumnView", () => {
  it("server-renders the stored column time, not the running clock", () => {
    const now = vi.spyOn(Date, "now");

    now.mockReturnValue(Date.parse("2026-09-12T10:02:00.000Z"));
    expect(timeLabel(renderColumn([makeTicket()]))).toBe("2m");

    now.mockReturnValue(Date.parse("2026-09-12T10:03:05.000Z"));
    expect(timeLabel(renderColumn([makeTicket()]))).toBe("2m");
  });
});

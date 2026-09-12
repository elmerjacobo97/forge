import { afterEach, describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";
import { DndContext } from "@dnd-kit/core";

import type { Ticket } from "../types/board";
import { TicketCard } from "./ticket-card";

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

function timerText(markup: string): string {
  return markup.match(/>(\d+:\d{2}(?::\d{2})?)</)?.[1] ?? "";
}

function renderCard(ticket: Ticket): string {
  return renderToString(
    <DndContext>
      <TicketCard
        ticket={ticket}
        onEdit={noop}
        onComments={noop}
        onMoveToColumn={noop}
        onUpdate={noop}
        onDelete={noop}
      />
    </DndContext>,
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("TicketCard", () => {
  it("server-renders the stored elapsed time, not the running clock", () => {
    const now = vi.spyOn(Date, "now");

    now.mockReturnValue(Date.parse("2026-09-12T10:02:00.000Z"));
    expect(timerText(renderCard(makeTicket()))).toBe("2:00");

    now.mockReturnValue(Date.parse("2026-09-12T10:03:05.000Z"));
    expect(timerText(renderCard(makeTicket()))).toBe("2:00");
  });

  it("server-renders the total elapsed time for a paused ticket", () => {
    const markup = renderCard(
      makeTicket({ timerStartedAt: null, isPaused: true, totalElapsedMs: 65_000 }),
    );

    expect(timerText(markup)).toBe("1:05");
  });
});

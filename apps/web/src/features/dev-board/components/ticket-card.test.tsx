// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";
import { render, waitFor } from "@testing-library/react";
import { DndContext } from "@dnd-kit/core";

import type { Ticket } from "../types/board";
import { formatLocalDateTime } from "../utils/planning-dates";
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
    responsibleName: null,
    startDate: null,
    dueDate: null,
    complexity: null,
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
        onAdjust={noop}
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

  it("renders the responsible as Resp. plus the name", () => {
    const markup = renderCard(makeTicket({ responsibleName: "Ada Lovelace" }));

    expect(markup).toContain("Resp.");
    expect(markup).toContain("Ada Lovelace");
  });

  it("renders planning metadata in the local timezone after hydration", async () => {
    const startDate = "2026-09-28T21:29:00.000Z";
    const dueDate = "2026-09-29T21:29:00.000Z";
    const { container } = render(
      <DndContext>
        <TicketCard
          ticket={makeTicket({ startDate, dueDate, complexity: "medium" })}
          onEdit={noop}
          onComments={noop}
          onAdjust={noop}
          onMoveToColumn={noop}
          onUpdate={noop}
          onDelete={noop}
        />
      </DndContext>,
    );

    await waitFor(() => {
      expect(container.textContent).toContain("Medium");
      expect(container.textContent).toContain(formatLocalDateTime(startDate));
      expect(container.textContent).toContain(formatLocalDateTime(dueDate));
    });
    expect(container.innerHTML).toContain(`datetime="${startDate}"`);
    expect(container.innerHTML).toContain(`datetime="${dueDate}"`);
  });

  it("omits empty planning metadata from the card", () => {
    const markup = renderCard(makeTicket());

    expect(markup).not.toContain("complexity");
    expect(markup).not.toContain("<time");
  });

  it("server-renders the total elapsed time for a paused ticket", () => {
    const markup = renderCard(
      makeTicket({ timerStartedAt: null, isPaused: true, totalElapsedMs: 65_000 }),
    );

    expect(timerText(markup)).toBe("1:05");
  });
});

// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { Ticket } from "../types/board";
import { formatLocalDateTime } from "../utils/planning-dates";
import { TicketDetailDialog } from "./ticket-detail-dialog";

const ticket: Ticket = {
  id: "ticket-1",
  projectId: "project-1",
  title: "Plan release",
  description: "",
  column: "review",
  position: 0,
  priority: "med",
  createdAt: "2026-09-01T00:00:00.000Z",
  timerStartedAt: null,
  totalElapsedMs: 0,
  isPaused: false,
  lastMovedAt: "2026-09-01T00:00:00.000Z",
  branch: null,
  prUrl: null,
  responsibleName: null,
  startDate: "2026-09-28T21:29:00.000Z",
  dueDate: "2026-09-29T21:29:00.000Z",
  complexity: "high",
};

describe("TicketDetailDialog planning fields", () => {
  it("shows complexity and local start and due dates", () => {
    render(
      <TicketDetailDialog
        ticket={ticket}
        projectName="Forge"
        comment={null}
        open
        onOpenChange={vi.fn()}
        onEdit={vi.fn()}
      />,
    );

    expect(screen.getByText("Planning")).toBeTruthy();
    expect(screen.getByText("Complexity:").parentElement?.textContent).toContain("High");
    expect(screen.getByText("Start Date:").parentElement?.textContent).toContain(
      formatLocalDateTime(ticket.startDate),
    );
    expect(screen.getByText("Due Date:").parentElement?.textContent).toContain(
      formatLocalDateTime(ticket.dueDate),
    );
  });

  it("shows an unset label for empty optional planning values", () => {
    render(
      <TicketDetailDialog
        ticket={{ ...ticket, startDate: null, dueDate: null, complexity: null }}
        projectName="Forge"
        comment={null}
        open
        onOpenChange={vi.fn()}
        onEdit={vi.fn()}
      />,
    );

    expect(screen.getByText("Complexity:").parentElement?.textContent).toContain("Not set");
    expect(screen.getByText("Start Date:").parentElement?.textContent).toContain("Not scheduled");
    expect(screen.getByText("Due Date:").parentElement?.textContent).toContain("Not scheduled");
  });
});

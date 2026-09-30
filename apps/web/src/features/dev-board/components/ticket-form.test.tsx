// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Ticket } from "../types/board";
import { TicketForm } from "./ticket-form";

const onSubmit = vi.fn();
const onOpenChange = vi.fn();

const ticket: Ticket = {
  id: "ticket-1",
  projectId: "project-1",
  title: "Plan release",
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
  responsibleName: null,
  startDate: new Date(2026, 8, 28, 21, 29).toISOString(),
  dueDate: new Date(2026, 8, 29, 21, 29).toISOString(),
  complexity: "high",
};

beforeEach(() => {
  vi.clearAllMocks();
  HTMLElement.prototype.scrollIntoView = vi.fn();
});

function renderForm(editTicket: Ticket | null = null) {
  return render(
    <TicketForm
      open
      onOpenChange={onOpenChange}
      editTicket={editTicket}
      onSubmit={onSubmit}
    />,
  );
}

function submitForm() {
  fireEvent.submit(document.getElementById("ticket-form")!);
}

describe("TicketForm planning fields", () => {
  it("submits planning dates as ISO instants and includes selected complexity", async () => {
    renderForm();
    fireEvent.change(screen.getByLabelText("Title"), { target: { value: "Plan release" } });
    fireEvent.change(screen.getByLabelText("Start Date"), {
      target: { value: "2026-09-28T21:29" },
    });
    fireEvent.change(screen.getByLabelText("Due Date"), {
      target: { value: "2026-09-29T21:29" },
    });
    fireEvent.click(screen.getByRole("combobox", { name: "Complexity" }));
    fireEvent.click(await screen.findByRole("option", { name: "High" }));
    submitForm();

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          startDate: new Date("2026-09-28T21:29").toISOString(),
          dueDate: new Date("2026-09-29T21:29").toISOString(),
          complexity: "high",
        }),
      );
    });
  });

  it("blocks submission when Start Date is later than Due Date", async () => {
    renderForm();
    fireEvent.change(screen.getByLabelText("Title"), { target: { value: "Plan release" } });
    fireEvent.change(screen.getByLabelText("Start Date"), {
      target: { value: "2026-09-29T21:29" },
    });
    fireEvent.change(screen.getByLabelText("Due Date"), {
      target: { value: "2026-09-28T21:29" },
    });
    submitForm();

    await waitFor(() => {
      expect(screen.getByText("Start Date must be on or before Due Date.")).toBeTruthy();
    });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("shows stored dates in local time and allows clearing planning fields", async () => {
    renderForm(ticket);
    await waitFor(() => {
      expect((screen.getByLabelText("Title") as HTMLInputElement).value).toBe("Plan release");
      expect((screen.getByLabelText("Start Date") as HTMLInputElement).value).toBe(
        "2026-09-28T21:29",
      );
      expect((screen.getByLabelText("Due Date") as HTMLInputElement).value).toBe(
        "2026-09-29T21:29",
      );
    });

    fireEvent.change(screen.getByLabelText("Start Date"), { target: { value: "" } });
    fireEvent.change(screen.getByLabelText("Due Date"), { target: { value: "" } });
    fireEvent.click(screen.getByRole("combobox", { name: "Complexity" }));
    fireEvent.click(await screen.findByRole("option", { name: "Not set" }));
    submitForm();

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ startDate: null, dueDate: null, complexity: null }),
      );
    });
  });
});

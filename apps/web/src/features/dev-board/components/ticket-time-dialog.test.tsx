// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { toast } from "sonner";

const adjustTicketTimeAction = vi.hoisted(() => vi.fn());
const getLastTimeEntryAction = vi.hoisted(() => vi.fn());

vi.mock("../actions", () => ({ adjustTicketTimeAction, getLastTimeEntryAction }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import type { Ticket } from "../types/board";
import { TicketTimeDialog } from "./ticket-time-dialog";

function makeTicket(overrides: Partial<Ticket> = {}): Ticket {
  return {
    id: "ticket-1",
    projectId: "project-1",
    title: "Adjust me",
    description: "",
    column: "in_progress",
    position: 0,
    priority: "med",
    createdAt: "2026-09-12T09:00:00.000Z",
    timerStartedAt: "2026-09-12T10:00:00.000Z",
    totalElapsedMs: 0,
    isPaused: false,
    lastMovedAt: "2026-09-12T10:00:00.000Z",
    branch: null,
    prUrl: null,
    ...overrides,
  };
}

const onAdjusted = vi.fn();
const onOpenChange = vi.fn();

function renderDialog(ticket: Ticket) {
  render(
    <TicketTimeDialog
      ticket={ticket}
      open
      onOpenChange={onOpenChange}
      onAdjusted={onAdjusted}
    />,
  );
}

function inputValue(label: string): string {
  return (screen.getByLabelText(label) as HTMLInputElement).value;
}

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("TicketTimeDialog", () => {
  it("retro-stops the running timer with the chosen duration", async () => {
    vi.spyOn(Date, "now").mockReturnValue(Date.parse("2026-09-12T12:00:00.000Z"));
    adjustTicketTimeAction.mockResolvedValue({
      ok: true,
      data: makeTicket({ isPaused: true, timerStartedAt: null }),
    });

    renderDialog(makeTicket());

    expect(inputValue("Hours")).toBe("2");

    fireEvent.click(screen.getByRole("button", { name: "1h" }));
    fireEvent.click(screen.getByRole("button", { name: "Stop timer" }));

    await waitFor(() => {
      expect(adjustTicketTimeAction).toHaveBeenCalledWith({
        ticketId: "ticket-1",
        action: "stop_at",
        endedAt: "2026-09-12T11:00:00.000Z",
      });
    });
    expect(onAdjusted).toHaveBeenCalledWith(expect.objectContaining({ id: "ticket-1" }), true);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("blocks durations that exceed the running session", () => {
    vi.spyOn(Date, "now").mockReturnValue(Date.parse("2026-09-12T10:10:00.000Z"));

    renderDialog(makeTicket());

    expect((screen.getByRole("button", { name: "30m" }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole("button", { name: "1h" }) as HTMLButtonElement).disabled).toBe(true);

    fireEvent.change(screen.getByLabelText("Minutes"), { target: { value: "20" } });

    expect(screen.getByText(/Exceeds current session/)).toBeTruthy();
    expect((screen.getByRole("button", { name: "Stop timer" }) as HTMLButtonElement).disabled).toBe(
      true,
    );

    fireEvent.change(screen.getByLabelText("Minutes"), { target: { value: "5" } });

    expect((screen.getByRole("button", { name: "Stop timer" }) as HTMLButtonElement).disabled).toBe(
      false,
    );
  });

  it("prefills only the running segment, ignoring earlier logged time", () => {
    vi.spyOn(Date, "now").mockReturnValue(Date.parse("2026-09-12T12:00:00.000Z"));

    renderDialog(
      makeTicket({ totalElapsedMs: 3_600_000, timerStartedAt: "2026-09-12T11:30:00.000Z" }),
    );

    expect(inputValue("Hours")).toBe("0");
    expect(inputValue("Minutes")).toBe("30");
  });

  it("edits and removes the last recorded session", async () => {
    const entry = {
      id: "entry-1",
      ticketId: "ticket-1",
      startedAt: "2026-09-12T08:00:00.000Z",
      endedAt: "2026-09-12T12:00:00.000Z",
      durationMs: 14_400_000,
    };
    getLastTimeEntryAction.mockResolvedValue({ ok: true, data: entry });
    adjustTicketTimeAction.mockResolvedValue({
      ok: true,
      data: makeTicket({ column: "review", timerStartedAt: null }),
    });

    renderDialog(
      makeTicket({ column: "review", timerStartedAt: null, totalElapsedMs: 14_400_000 }),
    );

    await waitFor(() => expect(inputValue("Hours")).toBe("4"));

    fireEvent.click(screen.getByRole("button", { name: "1h" }));
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(adjustTicketTimeAction).toHaveBeenCalledWith({
        ticketId: "ticket-1",
        action: "set_last_duration",
        durationMs: 3_600_000,
      });
    });

    fireEvent.click(screen.getByRole("button", { name: "Remove last session" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm remove" }));

    await waitFor(() => {
      expect(adjustTicketTimeAction).toHaveBeenCalledWith({
        ticketId: "ticket-1",
        action: "delete_last",
      });
    });
  });

  it("falls back to setting the total when there are no sessions", async () => {
    getLastTimeEntryAction.mockResolvedValue({ ok: true, data: null });
    adjustTicketTimeAction.mockResolvedValue({
      ok: true,
      data: makeTicket({ column: "review", timerStartedAt: null }),
    });

    renderDialog(makeTicket({ column: "review", timerStartedAt: null, totalElapsedMs: 3_600_000 }));

    await waitFor(() => expect(inputValue("Hours")).toBe("1"));

    fireEvent.click(screen.getByRole("button", { name: "Set total" }));

    await waitFor(() => {
      expect(adjustTicketTimeAction).toHaveBeenCalledWith({
        ticketId: "ticket-1",
        action: "set_total",
        durationMs: 3_600_000,
      });
    });
  });

  it("shows a toast and keeps the dialog open when the action fails", async () => {
    vi.spyOn(Date, "now").mockReturnValue(Date.parse("2026-09-12T12:00:00.000Z"));
    adjustTicketTimeAction.mockResolvedValue({ ok: false, message: "boom" });

    renderDialog(makeTicket());

    fireEvent.click(screen.getByRole("button", { name: "Stop timer" }));

    await waitFor(() => expect(vi.mocked(toast.error)).toHaveBeenCalledWith("boom"));
    expect(onAdjusted).not.toHaveBeenCalled();
    expect(onOpenChange).not.toHaveBeenCalled();
  });
});

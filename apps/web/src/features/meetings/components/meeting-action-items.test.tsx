// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  update: vi.fn(),
  complete: vi.fn(),
  remove: vi.fn(),
  convert: vi.fn(),
}));

vi.mock("../actions", () => ({
  createMeetingActionItemAction: mocks.create,
  updateMeetingActionItemAction: mocks.update,
  setMeetingActionItemCompletedAction: mocks.complete,
  deleteMeetingActionItemAction: mocks.remove,
  createTicketFromMeetingActionItemAction: mocks.convert,
}));

import { MeetingActionItems } from "./meeting-action-items";

const projectId = "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d";
const actionItem = {
  id: "d7f1ce67-cf72-4f8e-8545-f0d2fb4ec501",
  meetingId: "e7f1ce67-cf72-4f8e-8545-f0d2fb4ec501",
  title: "Send the recap",
  details: "Share the decisions.",
  responsibleName: "Alex",
  dueDate: null,
  isCompleted: false,
  ticketId: null,
  createdAt: "2026-09-26T10:00:00.000Z",
  updatedAt: "2026-09-26T10:00:00.000Z",
  linkedTicket: null,
};
const project = {
  id: projectId,
  name: "Forge",
  description: "",
  status: "in_progress" as const,
  createdAt: "2026-09-01T00:00:00.000Z",
};
const ticket = { id: "ticket-1", projectId, title: "Send the recap", column: "backlog" as const };

beforeEach(() => {
  vi.clearAllMocks();
  Element.prototype.scrollIntoView = vi.fn();
});

describe("MeetingActionItems conversion", () => {
  it("converts using the meeting project and displays a link to the ticket", async () => {
    mocks.convert.mockResolvedValue({ ok: true, data: ticket });
    render(
      <MeetingActionItems
        meetingId={actionItem.meetingId}
        projectId={projectId}
        projects={[project]}
        initialItems={[actionItem]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Create ticket" }));

    await waitFor(() => expect(mocks.convert).toHaveBeenCalledWith(actionItem.id, projectId));
    const ticketLink = await screen.findByRole("link", { name: "Send the recap · backlog" });
    expect(ticketLink.getAttribute("href")).toBe(`/dev-board/${projectId}?ticket=${ticket.id}`);
    expect(screen.queryByRole("button", { name: "Create ticket" })).toBeNull();
  });

  it("requires choosing a project when the meeting has none", async () => {
    mocks.convert.mockResolvedValue({ ok: true, data: ticket });
    render(
      <MeetingActionItems
        meetingId={actionItem.meetingId}
        projectId={null}
        projects={[project]}
        initialItems={[actionItem]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Create ticket" }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByRole("heading", { name: "Choose a project" })).toBeTruthy();
    const confirm = within(dialog).getByRole("button", {
      name: "Create ticket",
    }) as HTMLButtonElement;
    expect(confirm.disabled).toBe(true);

    fireEvent.click(within(dialog).getByRole("combobox"));
    fireEvent.click(await screen.findByRole("option", { name: "Forge" }));
    expect(confirm.disabled).toBe(false);
    fireEvent.click(confirm);

    await waitFor(() => expect(mocks.convert).toHaveBeenCalledWith(actionItem.id, projectId));
  });
});

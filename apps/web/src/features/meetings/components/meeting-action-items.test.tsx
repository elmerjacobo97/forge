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
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

import { toast } from "sonner";
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

describe("MeetingActionItems actions", () => {
  it("creates a next step and normalizes optional fields", async () => {
    mocks.create.mockResolvedValue({
      ok: true,
      data: {
        ...actionItem,
        id: "created-action-item",
        title: "Prepare demo",
        details: "Plan the flow",
        responsibleName: "Sam",
        dueDate: "2026-10-02",
      },
    });
    render(
      <MeetingActionItems
        meetingId={actionItem.meetingId}
        projectId={projectId}
        projects={[project]}
        initialItems={[]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Add next step" }));
    fireEvent.change(screen.getByLabelText("Next step"), { target: { value: "Prepare demo" } });
    fireEvent.change(screen.getByLabelText(/Details/), { target: { value: "Plan the flow" } });
    fireEvent.change(screen.getByLabelText(/Responsible/), { target: { value: "  Sam  " } });
    fireEvent.change(screen.getByLabelText(/Due date/), { target: { value: "2026-10-02" } });
    fireEvent.submit(screen.getByLabelText("Next step").closest("form")!);

    await waitFor(() =>
      expect(mocks.create).toHaveBeenCalledWith(actionItem.meetingId, {
        title: "Prepare demo",
        details: "Plan the flow",
        responsibleName: "Sam",
        dueDate: "2026-10-02",
      }),
    );
    expect(await screen.findByRole("heading", { name: "Prepare demo" })).toBeTruthy();
  });

  it("edits a next step and persists the trimmed form values", async () => {
    mocks.update.mockResolvedValue({
      ok: true,
      data: { ...actionItem, title: "Share release notes", responsibleName: "Morgan" },
    });
    render(
      <MeetingActionItems
        meetingId={actionItem.meetingId}
        projectId={projectId}
        projects={[project]}
        initialItems={[actionItem]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Edit Send the recap" }));
    fireEvent.change(screen.getByLabelText("Next step"), {
      target: { value: "Share release notes" },
    });
    fireEvent.change(screen.getByLabelText(/Responsible/), { target: { value: "  Morgan  " } });
    fireEvent.submit(screen.getByLabelText("Next step").closest("form")!);

    await waitFor(() =>
      expect(mocks.update).toHaveBeenCalledWith(actionItem.id, {
        title: "Share release notes",
        details: actionItem.details,
        responsibleName: "Morgan",
        dueDate: null,
      }),
    );
    expect(await screen.findByRole("heading", { name: "Share release notes" })).toBeTruthy();
  });

  it("marks a next step complete", async () => {
    mocks.complete.mockResolvedValue({ ok: true, data: { isCompleted: true } });
    render(
      <MeetingActionItems
        meetingId={actionItem.meetingId}
        projectId={projectId}
        projects={[project]}
        initialItems={[actionItem]}
      />,
    );

    fireEvent.click(screen.getByRole("checkbox", { name: "Complete Send the recap" }));

    await waitFor(() => expect(mocks.complete).toHaveBeenCalledWith(actionItem.id, true));
    expect(
      await screen.findByRole("checkbox", { name: "Reopen Send the recap", checked: true }),
    ).toBeTruthy();
  });

  it("deletes a next step after confirmation", async () => {
    mocks.remove.mockResolvedValue({ ok: true, data: undefined });
    render(
      <MeetingActionItems
        meetingId={actionItem.meetingId}
        projectId={projectId}
        projects={[project]}
        initialItems={[actionItem]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Delete Send the recap" }));
    const dialog = await screen.findByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "Remove step" }));

    await waitFor(() => expect(mocks.remove).toHaveBeenCalledWith(actionItem.id));
    expect(
      await screen.findByText(
        "No next steps recorded. Add one when the conversation creates work.",
      ),
    ).toBeTruthy();
  });

  it("keeps the create form open and reports a failed save", async () => {
    mocks.create.mockResolvedValue({ ok: false, message: "Could not save next step." });
    render(
      <MeetingActionItems
        meetingId={actionItem.meetingId}
        projectId={projectId}
        projects={[project]}
        initialItems={[]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Add next step" }));
    fireEvent.change(screen.getByLabelText("Next step"), { target: { value: "Prepare demo" } });
    fireEvent.submit(screen.getByLabelText("Next step").closest("form")!);

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Could not save next step."));
    expect(screen.getByLabelText("Next step")).toBeTruthy();
    expect((screen.getByLabelText("Next step") as HTMLInputElement).value).toBe("Prepare demo");
  });

  it("leaves the item and confirmation dialog intact when deletion fails", async () => {
    mocks.remove.mockResolvedValue({ ok: false, message: "Could not remove next step." });
    render(
      <MeetingActionItems
        meetingId={actionItem.meetingId}
        projectId={projectId}
        projects={[project]}
        initialItems={[actionItem]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Delete Send the recap" }));
    const dialog = await screen.findByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "Remove step" }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Could not remove next step."));
    expect(screen.getByRole("dialog")).toBeTruthy();
    fireEvent.click(within(dialog).getByRole("button", { name: "Cancel" }));
    expect(await screen.findByRole("heading", { name: "Send the recap" })).toBeTruthy();
  });
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

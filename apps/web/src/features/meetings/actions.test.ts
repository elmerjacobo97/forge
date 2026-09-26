import { beforeEach, describe, expect, it, vi } from "vitest";

const getCurrentUser = vi.hoisted(() => vi.fn());
vi.mock("@/features/auth/server", () => ({ getCurrentUser }));

const revalidatePath = vi.hoisted(() => vi.fn());
vi.mock("next/cache", () => ({ revalidatePath }));

const service = vi.hoisted(() => ({
  createMeeting: vi.fn(),
  updateMeeting: vi.fn(),
  deleteMeeting: vi.fn(),
  createActionItem: vi.fn(),
  updateActionItem: vi.fn(),
  setActionItemCompleted: vi.fn(),
  deleteActionItem: vi.fn(),
  createTicketFromActionItem: vi.fn(),
}));
vi.mock("./services/meetings-service", () => ({ meetingsService: service }));

import {
  createMeetingAction,
  createMeetingActionItemAction,
  createTicketFromMeetingActionItemAction,
  deleteMeetingAction,
  setMeetingActionItemCompletedAction,
  updateMeetingActionItemAction,
} from "./actions";

const meetingId = "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d";
const actionItemId = "d7f1ce67-cf72-4f8e-8545-f0d2fb4ec501";
const projectId = "b1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d";
const meetingInput = {
  projectId: null,
  title: "Weekly planning",
  meetingAt: "2026-09-26T10:00:00.000Z",
  attendees: [],
  context: "",
  decisions: [],
};
const actionInput = { title: "Send recap", details: "", responsibleName: "Sam", dueDate: null };

beforeEach(() => vi.clearAllMocks());

describe("meeting actions", () => {
  it("requires an authenticated session before writes", async () => {
    getCurrentUser.mockResolvedValue(null);

    await expect(createMeetingAction(meetingInput)).resolves.toMatchObject({ ok: false });
    await expect(deleteMeetingAction(meetingId)).resolves.toMatchObject({ ok: false });
    await expect(createMeetingActionItemAction(meetingId, actionInput)).resolves.toMatchObject({
      ok: false,
    });
    expect(service.createMeeting).not.toHaveBeenCalled();
    expect(service.deleteMeeting).not.toHaveBeenCalled();
    expect(service.createActionItem).not.toHaveBeenCalled();
  });

  it("rejects malformed inputs before calling services", async () => {
    getCurrentUser.mockResolvedValue({ id: "user-1" });

    await expect(createMeetingAction({ ...meetingInput, title: "" })).resolves.toMatchObject({
      ok: false,
    });
    await expect(createMeetingActionItemAction("bad-id", actionInput)).resolves.toMatchObject({
      ok: false,
    });
    await expect(
      updateMeetingActionItemAction(actionItemId, { ...actionInput, dueDate: "later" }),
    ).resolves.toMatchObject({
      ok: false,
    });
    expect(service.createMeeting).not.toHaveBeenCalled();
    expect(service.createActionItem).not.toHaveBeenCalled();
    expect(service.updateActionItem).not.toHaveBeenCalled();
  });

  it("creates meetings and revalidates the global meetings route", async () => {
    getCurrentUser.mockResolvedValue({ id: "user-1" });
    service.createMeeting.mockResolvedValue({ id: meetingId, title: "Weekly planning" });

    await expect(createMeetingAction(meetingInput)).resolves.toEqual({
      ok: true,
      data: { id: meetingId, title: "Weekly planning" },
    });
    expect(service.createMeeting).toHaveBeenCalledWith(meetingInput);
    expect(revalidatePath).toHaveBeenCalledWith("/meetings");
  });

  it("cleans action-item names and revalidates after completion", async () => {
    getCurrentUser.mockResolvedValue({ id: "user-1" });
    service.createActionItem.mockResolvedValue({ id: actionItemId });
    service.setActionItemCompleted.mockResolvedValue({ id: actionItemId, isCompleted: true });

    await expect(
      createMeetingActionItemAction(meetingId, { ...actionInput, responsibleName: "  " }),
    ).resolves.toMatchObject({ ok: true, data: { id: actionItemId } });
    expect(service.createActionItem).toHaveBeenCalledWith(meetingId, {
      ...actionInput,
      responsibleName: null,
    });

    await expect(setMeetingActionItemCompletedAction(actionItemId, true)).resolves.toMatchObject({
      ok: true,
      data: { id: actionItemId, isCompleted: true },
    });
    expect(service.setActionItemCompleted).toHaveBeenCalledWith(actionItemId, true);
    expect(revalidatePath).toHaveBeenNthCalledWith(1, "/meetings");
    expect(revalidatePath).toHaveBeenNthCalledWith(2, "/meetings/[meetingId]", "page");
    expect(revalidatePath).toHaveBeenNthCalledWith(3, "/meetings");
    expect(revalidatePath).toHaveBeenNthCalledWith(4, "/meetings/[meetingId]", "page");
  });

  it("calls the conversion service and refreshes the ticket board", async () => {
    getCurrentUser.mockResolvedValue({ id: "user-1" });
    service.createTicketFromActionItem.mockResolvedValue({ id: "ticket-1", projectId });

    await expect(createTicketFromMeetingActionItemAction(actionItemId, projectId)).resolves.toEqual(
      { ok: true, data: { id: "ticket-1", projectId } },
    );
    expect(service.createTicketFromActionItem).toHaveBeenCalledWith(actionItemId, projectId);
    expect(revalidatePath).toHaveBeenCalledWith("/meetings");
    expect(revalidatePath).toHaveBeenCalledWith("/dev-board", "layout");
    expect(revalidatePath).toHaveBeenCalledWith(`/dev-board/${projectId}`);
  });

  it("surfaces service errors without revalidation", async () => {
    getCurrentUser.mockResolvedValue({ id: "user-1" });
    service.deleteMeeting.mockRejectedValue(new Error("delete denied"));

    await expect(deleteMeetingAction(meetingId)).resolves.toEqual({
      ok: false,
      message: "delete denied",
    });
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});

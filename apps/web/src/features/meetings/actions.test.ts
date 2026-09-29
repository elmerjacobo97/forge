import { beforeEach, describe, expect, it, vi } from "vitest";

const getCurrentUser = vi.hoisted(() => vi.fn());
vi.mock("@/features/auth/server", () => ({ getCurrentUser }));

const revalidatePath = vi.hoisted(() => vi.fn());
vi.mock("next/cache", () => ({ revalidatePath }));

const service = vi.hoisted(() => ({
  createMeeting: vi.fn(),
  updateMeeting: vi.fn(),
  deleteMeeting: vi.fn(),
}));
vi.mock("./services/meetings-service", () => ({ meetingsService: service }));

import { createMeetingAction, deleteMeetingAction, updateMeetingAction } from "./actions";

const meetingId = "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d";
const meetingInput = {
  projectId: null,
  title: "Weekly planning",
  meetingAt: "2026-09-26T10:00:00.000Z",
  attendees: [],
  context: "",
  decisions: [],
};
beforeEach(() => vi.clearAllMocks());

describe("meeting actions", () => {
  it("requires an authenticated session before writes", async () => {
    getCurrentUser.mockResolvedValue(null);

    await expect(createMeetingAction(meetingInput)).resolves.toMatchObject({ ok: false });
    await expect(deleteMeetingAction(meetingId)).resolves.toMatchObject({ ok: false });
    expect(service.createMeeting).not.toHaveBeenCalled();
    expect(service.deleteMeeting).not.toHaveBeenCalled();
  });

  it("rejects malformed inputs before calling services", async () => {
    getCurrentUser.mockResolvedValue({ id: "user-1" });

    await expect(createMeetingAction({ ...meetingInput, title: "" })).resolves.toMatchObject({
      ok: false,
    });
    await expect(updateMeetingAction("bad-id", meetingInput)).resolves.toMatchObject({
      ok: false,
    });
    expect(service.createMeeting).not.toHaveBeenCalled();
    expect(service.updateMeeting).not.toHaveBeenCalled();
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

  it("updates meetings and revalidates the list and detail routes", async () => {
    getCurrentUser.mockResolvedValue({ id: "user-1" });
    service.updateMeeting.mockResolvedValue({ id: meetingId, title: "Updated planning" });

    await expect(updateMeetingAction(meetingId, meetingInput)).resolves.toEqual({
      ok: true,
      data: { id: meetingId, title: "Updated planning" },
    });
    expect(service.updateMeeting).toHaveBeenCalledWith(meetingId, meetingInput);
    expect(revalidatePath).toHaveBeenNthCalledWith(1, "/meetings");
    expect(revalidatePath).toHaveBeenNthCalledWith(2, "/meetings/[meetingId]", "page");
  });

  it("deletes meetings and revalidates the list and detail routes", async () => {
    getCurrentUser.mockResolvedValue({ id: "user-1" });
    service.deleteMeeting.mockResolvedValue(undefined);

    await expect(deleteMeetingAction(meetingId)).resolves.toEqual({ ok: true, data: undefined });
    expect(service.deleteMeeting).toHaveBeenCalledWith(meetingId);
    expect(revalidatePath).toHaveBeenNthCalledWith(1, "/meetings");
    expect(revalidatePath).toHaveBeenNthCalledWith(2, "/meetings/[meetingId]", "page");
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

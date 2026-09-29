import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  notFound: vi.fn(() => {
    throw new Error("NOT_FOUND");
  }),
  getMeeting: vi.fn(),
  listProjects: vi.fn(),
}));

vi.mock("next/navigation", () => ({ notFound: mocks.notFound }));
vi.mock("@/features/meetings/services/meetings-service", () => ({
  meetingsService: { getMeeting: mocks.getMeeting },
}));
vi.mock("@/features/dev-board/services/projects-service", () => ({
  projectsService: { listProjects: mocks.listProjects },
}));
vi.mock("@/features/meetings/components/meeting-editor", () => ({
  MeetingEditor: () => null,
}));

import EditMeetingPage from "./page";

const meetingId = "d7f1ce67-cf72-4f8e-8545-f0d2fb4ec501";
const meeting = {
  id: meetingId,
  projectId: null,
  title: "Planning",
  meetingAt: "2026-09-26T10:00:00.000Z",
  attendees: [],
  context: "",
  decisions: [],
  createdAt: "2026-09-26T10:00:00.000Z",
  updatedAt: "2026-09-26T10:00:00.000Z",
};

beforeEach(() => vi.clearAllMocks());

describe("EditMeetingPage", () => {
  it("loads a valid meeting for the full-page editor", async () => {
    mocks.getMeeting.mockResolvedValue(meeting);
    mocks.listProjects.mockResolvedValue([]);

    const element = await EditMeetingPage({ params: Promise.resolve({ meetingId }) });

    expect(mocks.getMeeting).toHaveBeenCalledWith(meetingId);
    expect(element.key).toBe(meetingId);
    expect(element.props.initialMeeting).toBe(meeting);
  });

  it("returns not-found for invalid or unavailable meeting ids", async () => {
    await expect(
      EditMeetingPage({ params: Promise.resolve({ meetingId: "invalid" }) }),
    ).rejects.toThrow("NOT_FOUND");
    expect(mocks.getMeeting).not.toHaveBeenCalled();

    mocks.getMeeting.mockResolvedValue(null);
    mocks.listProjects.mockResolvedValue([]);
    await expect(EditMeetingPage({ params: Promise.resolve({ meetingId }) })).rejects.toThrow(
      "NOT_FOUND",
    );
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  redirect: vi.fn((path: string) => {
    throw new Error(`REDIRECT:${path}`);
  }),
  notFound: vi.fn(() => {
    throw new Error("NOT_FOUND");
  }),
  getMeeting: vi.fn(),
  listProjects: vi.fn(),
}));

vi.mock("next/navigation", () => ({ redirect: mocks.redirect, notFound: mocks.notFound }));
vi.mock("@/features/auth/server", () => ({ getCurrentUser: mocks.getCurrentUser }));
vi.mock("@/features/meetings/services/meetings-service", () => ({
  meetingsService: { getMeeting: mocks.getMeeting },
}));
vi.mock("@/features/dev-board/services/projects-service", () => ({
  projectsService: { listProjects: mocks.listProjects },
}));
vi.mock("@/features/meetings/components/meeting-editor", () => ({
  MeetingEditor: () => null,
}));

import MeetingDetailPage from "./page";

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
  actionItems: [],
};

beforeEach(() => vi.clearAllMocks());

describe("MeetingDetailPage", () => {
  it("loads a valid meeting for the full-page editor", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: "user-1" });
    mocks.getMeeting.mockResolvedValue(meeting);
    mocks.listProjects.mockResolvedValue([]);

    const element = await MeetingDetailPage({ params: Promise.resolve({ meetingId }) });

    expect(mocks.getMeeting).toHaveBeenCalledWith(meetingId);
    expect(element.key).toBe(meetingId);
    expect(element.props.initialMeeting).toBe(meeting);
  });

  it("returns not-found for invalid or unavailable meeting ids", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: "user-1" });
    await expect(
      MeetingDetailPage({ params: Promise.resolve({ meetingId: "invalid" }) }),
    ).rejects.toThrow("NOT_FOUND");
    expect(mocks.getMeeting).not.toHaveBeenCalled();

    mocks.getMeeting.mockResolvedValue(null);
    mocks.listProjects.mockResolvedValue([]);
    await expect(MeetingDetailPage({ params: Promise.resolve({ meetingId }) })).rejects.toThrow(
      "NOT_FOUND",
    );
  });

  it("redirects unauthenticated users before reading the meeting", async () => {
    mocks.getCurrentUser.mockResolvedValue(null);

    await expect(MeetingDetailPage({ params: Promise.resolve({ meetingId }) })).rejects.toThrow(
      "REDIRECT:/login",
    );
    expect(mocks.getMeeting).not.toHaveBeenCalled();
  });
});

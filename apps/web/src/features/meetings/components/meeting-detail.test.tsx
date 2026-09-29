// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  refresh: vi.fn(),
  deleteMeeting: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push, refresh: mocks.refresh }),
}));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
vi.mock("../actions", () => ({ deleteMeetingAction: mocks.deleteMeeting }));

import { MeetingDetail } from "./meeting-detail";

const projectId = "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d";
const meeting = {
  id: "d7f1ce67-cf72-4f8e-8545-f0d2fb4ec501",
  projectId,
  title: "Release planning",
  meetingAt: "2026-09-26T10:00:00.000Z",
  attendees: ["Alex", "Sam"],
  context: "Plan the next release.",
  decisions: ["Ship the first slice."],
  createdAt: "2026-09-26T10:00:00.000Z",
  updatedAt: "2026-09-26T10:00:00.000Z",
};

beforeEach(() => {
  vi.clearAllMocks();
  Element.prototype.scrollIntoView = vi.fn();
});

describe("MeetingDetail", () => {
  it("renders the meeting in read-only mode", () => {
    render(
      <MeetingDetail
        meeting={meeting}
        projectName="Forge"
      />,
    );

    expect(screen.getByRole("heading", { name: "Release planning" })).toBeTruthy();
    expect(screen.getByText("Plan the next release.")).toBeTruthy();
    expect(screen.getByText("Ship the first slice.")).toBeTruthy();
    expect(screen.getByText("Alex")).toBeTruthy();
    expect(screen.getByText("Sam")).toBeTruthy();
    expect(screen.queryByText("Next steps")).toBeNull();
    expect(document.getElementById("meeting-form")).toBeNull();
  });

  it("links to the editor and confirms deletion from the detail", async () => {
    mocks.deleteMeeting.mockResolvedValue({ ok: true, data: undefined });
    render(
      <MeetingDetail
        meeting={meeting}
        projectName="Forge"
      />,
    );

    expect(screen.getByRole("link", { name: "Edit" }).getAttribute("href")).toBe(
      `/meetings/${meeting.id}/edit`,
    );

    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(screen.getByText("Delete this meeting?")).toBeTruthy();
    expect(screen.getByText(/Dev Board tickets are not affected/)).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Delete meeting" }));

    await waitFor(() => expect(mocks.deleteMeeting).toHaveBeenCalledWith(meeting.id));
    await waitFor(() => expect(mocks.push).toHaveBeenCalledWith("/meetings"));
  });

  it("keeps the detail open when deletion fails", async () => {
    mocks.deleteMeeting.mockResolvedValue({ ok: false, message: "delete denied" });
    render(<MeetingDetail meeting={meeting} />);

    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    fireEvent.click(screen.getByRole("button", { name: "Delete meeting" }));

    await waitFor(() => expect(mocks.deleteMeeting).toHaveBeenCalledOnce());
    expect(mocks.push).not.toHaveBeenCalled();
    expect(screen.getByText("Delete this meeting?")).toBeTruthy();
  });
});

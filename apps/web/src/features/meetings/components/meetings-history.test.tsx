// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const mocks = vi.hoisted(() => ({
  replace: vi.fn(),
  refresh: vi.fn(),
  deleteMeeting: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/meetings",
  useRouter: () => ({ replace: mocks.replace, refresh: mocks.refresh }),
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
vi.mock("../actions", () => ({ deleteMeetingAction: mocks.deleteMeeting }));

import { MeetingsHistory } from "./meetings-history";

const projectId = "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d";
const project = {
  id: projectId,
  name: "Forge",
  description: "",
  status: "in_progress" as const,
  createdAt: "2026-09-01T00:00:00.000Z",
};
const meeting = {
  id: "d7f1ce67-cf72-4f8e-8545-f0d2fb4ec501",
  projectId,
  title: "Release planning",
  meetingAt: "2026-09-26T10:00:00.000Z",
  attendees: ["Alex"],
  context: "Plan the next release.",
  decisions: ["Ship the first slice."],
  createdAt: "2026-09-26T10:00:00.000Z",
  updatedAt: "2026-09-26T10:00:00.000Z",
};

beforeEach(() => {
  vi.clearAllMocks();
  Element.prototype.scrollIntoView = vi.fn();
  Element.prototype.hasPointerCapture = vi.fn();
  Element.prototype.setPointerCapture = vi.fn();
  Element.prototype.releasePointerCapture = vi.fn();
});

function renderHistory(meetings = [meeting], total = 1) {
  return render(
    <MeetingsHistory
      page={{ meetings, total }}
      filters={{ q: "", projectId: null }}
      projects={[project]}
    />,
  );
}

describe("MeetingsHistory", () => {
  it("renders meeting rows with metadata and links to detail and creation", () => {
    renderHistory();

    expect(screen.getByRole("heading", { name: "Meetings" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "New meeting" }).getAttribute("href")).toBe(
      "/meetings/new",
    );
    expect(screen.getByRole("link", { name: /Release planning/ }).getAttribute("href")).toBe(
      `/meetings/${meeting.id}`,
    );
    expect(screen.getByText("Forge")).toBeTruthy();
    expect(screen.getByText("1 attendee")).toBeTruthy();
    expect(screen.getByText("1 decision")).toBeTruthy();
  });

  it("writes search and project filters to the URL", async () => {
    renderHistory([], 0);

    fireEvent.change(
      screen.getByRole("searchbox", { name: "Search meetings by title or context" }),
      {
        target: { value: "release" },
      },
    );
    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith("/meetings?q=release"));

    fireEvent.click(screen.getByRole("combobox", { name: "Filter meetings by project" }));
    fireEvent.click(screen.getByRole("option", { name: "Forge" }));
    expect(mocks.replace).toHaveBeenLastCalledWith(`/meetings?projectId=${projectId}`);
  });

  it("links each row menu to the editor", async () => {
    renderHistory();

    fireEvent.pointerDown(screen.getByRole("button", { name: "Actions for Release planning" }));

    const editItem = await screen.findByRole("menuitem", { name: "Edit" });
    expect(editItem.getAttribute("href")).toBe(`/meetings/${meeting.id}/edit`);
  });

  it("deletes a meeting from the row menu and refreshes the list", async () => {
    mocks.deleteMeeting.mockResolvedValue({ ok: true, data: undefined });
    renderHistory();

    fireEvent.pointerDown(screen.getByRole("button", { name: "Actions for Release planning" }));
    fireEvent.click(await screen.findByRole("menuitem", { name: "Delete" }));

    expect(screen.getByText("Delete this meeting?")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Delete meeting" }));

    await waitFor(() => expect(mocks.deleteMeeting).toHaveBeenCalledWith(meeting.id));
    await waitFor(() => expect(mocks.refresh).toHaveBeenCalledOnce());
  });

  it("keeps the row when deletion fails", async () => {
    mocks.deleteMeeting.mockResolvedValue({ ok: false, message: "delete denied" });
    renderHistory();

    fireEvent.pointerDown(screen.getByRole("button", { name: "Actions for Release planning" }));
    fireEvent.click(await screen.findByRole("menuitem", { name: "Delete" }));
    fireEvent.click(screen.getByRole("button", { name: "Delete meeting" }));

    await waitFor(() => expect(mocks.deleteMeeting).toHaveBeenCalledOnce());
    expect(mocks.refresh).not.toHaveBeenCalled();
  });
});

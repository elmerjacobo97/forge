// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";

const mocks = vi.hoisted(() => ({ replace: vi.fn() }));

vi.mock("next/navigation", () => ({
  usePathname: () => "/meetings",
  useRouter: () => ({ replace: mocks.replace }),
  useSearchParams: () => new URLSearchParams(),
}));

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
  vi.useFakeTimers();
  mocks.replace.mockClear();
  Element.prototype.scrollIntoView = vi.fn();
});

afterEach(() => vi.useRealTimers());

describe("MeetingsHistory", () => {
  it("renders meeting notes and links to create and edit pages", () => {
    render(
      <MeetingsHistory
        page={{ meetings: [meeting], total: 1 }}
        filters={{ q: "", projectId: null }}
        projects={[project]}
      />,
    );

    expect(screen.getByRole("heading", { name: "Meetings" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "New meeting" }).getAttribute("href")).toBe(
      "/meetings/new",
    );
    expect(screen.getByRole("link", { name: /Release planning/ }).getAttribute("href")).toBe(
      `/meetings/${meeting.id}`,
    );
    expect(screen.getByText("Forge")).toBeTruthy();
  });

  it("writes search and project filters to the URL", () => {
    render(
      <MeetingsHistory
        page={{ meetings: [], total: 0 }}
        filters={{ q: "", projectId: null }}
        projects={[project]}
      />,
    );

    fireEvent.change(
      screen.getByRole("searchbox", { name: "Search meetings by title or context" }),
      {
        target: { value: "release" },
      },
    );
    act(() => vi.advanceTimersByTime(250));
    expect(mocks.replace).toHaveBeenCalledWith("/meetings?q=release");

    fireEvent.click(screen.getByRole("combobox", { name: "Filter meetings by project" }));
    fireEvent.click(screen.getByRole("option", { name: "Forge" }));
    expect(mocks.replace).toHaveBeenLastCalledWith(`/meetings?projectId=${projectId}`);
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  redirect: vi.fn((path: string) => {
    throw new Error(`REDIRECT:${path}`);
  }),
  fetchMeetingsPage: vi.fn(),
  listProjects: vi.fn(),
}));

vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("@/features/auth/server", () => ({ getCurrentUser: mocks.getCurrentUser }));
vi.mock("@/features/meetings/services/meetings-service", () => ({
  meetingsService: { fetchMeetingsPage: mocks.fetchMeetingsPage },
}));
vi.mock("@/features/dev-board/services/projects-service", () => ({
  projectsService: { listProjects: mocks.listProjects },
}));
vi.mock("@/features/meetings/components/meetings-history", () => ({
  MeetingsHistory: () => null,
}));

import MeetingsPage from "./page";

beforeEach(() => vi.clearAllMocks());

describe("MeetingsPage", () => {
  it("requires a user and loads the URL filters with bounded history", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: "user-1" });
    const page = { meetings: [], total: 0 };
    const projects = [{ id: "project-1", name: "Forge" }];
    mocks.fetchMeetingsPage.mockResolvedValue(page);
    mocks.listProjects.mockResolvedValue(projects);

    const element = await MeetingsPage({
      searchParams: Promise.resolve({
        q: "  planning  ",
        projectId: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
        visible: "24",
      }),
    });

    expect(mocks.fetchMeetingsPage).toHaveBeenCalledWith(
      { q: "planning", projectId: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d" },
      0,
      24,
    );
    expect(mocks.listProjects).toHaveBeenCalledOnce();
    expect(element.props).toEqual({
      page,
      filters: { q: "planning", projectId: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d" },
      projects,
    });
  });

  it("redirects before loading private data without a session", async () => {
    mocks.getCurrentUser.mockResolvedValue(null);

    await expect(MeetingsPage({ searchParams: Promise.resolve({}) })).rejects.toThrow(
      "REDIRECT:/login",
    );
    expect(mocks.fetchMeetingsPage).not.toHaveBeenCalled();
    expect(mocks.listProjects).not.toHaveBeenCalled();
  });
});

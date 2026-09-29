import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  fetchMeetingsPage: vi.fn(),
  listProjects: vi.fn(),
}));

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
  it("loads the URL filters with bounded history", async () => {
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
});

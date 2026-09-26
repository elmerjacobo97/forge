import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  redirect: vi.fn((path: string) => {
    throw new Error(`REDIRECT:${path}`);
  }),
  listProjects: vi.fn(),
}));

vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("@/features/auth/server", () => ({ getCurrentUser: mocks.getCurrentUser }));
vi.mock("@/features/dev-board/services/projects-service", () => ({
  projectsService: { listProjects: mocks.listProjects },
}));
vi.mock("@/features/meetings/components/meeting-editor", () => ({
  MeetingEditor: () => null,
}));

import NewMeetingPage from "./page";

const projectId = "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d";

beforeEach(() => vi.clearAllMocks());

describe("NewMeetingPage", () => {
  it("preselects a requested project only when it belongs to the user's project list", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: "user-1" });
    mocks.listProjects.mockResolvedValue([{ id: projectId, name: "Forge" }]);

    const element = await NewMeetingPage({
      searchParams: Promise.resolve({ projectId, returnTo: "project" }),
    });

    expect(element.key).toContain(projectId);
    expect(element.props.initialProjectId).toBe(projectId);
    expect(element.props.returnToProjectId).toBe(projectId);
    expect(element.props.initialMeeting).toBeNull();
    expect(element.props.initialMeetingAt).toEqual(expect.any(String));
  });

  it("uses a distinct editor key for global and project-origin creation", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: "user-1" });
    mocks.listProjects.mockResolvedValue([{ id: projectId, name: "Forge" }]);

    const globalEditor = await NewMeetingPage({ searchParams: Promise.resolve({}) });
    const projectEditor = await NewMeetingPage({
      searchParams: Promise.resolve({ projectId, returnTo: "project" }),
    });

    expect(globalEditor.key).not.toBe(projectEditor.key);
  });

  it("does not preselect an invalid or unavailable project", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: "user-1" });
    mocks.listProjects.mockResolvedValue([{ id: "another-project", name: "Other" }]);

    const element = await NewMeetingPage({
      searchParams: Promise.resolve({ projectId }),
    });

    expect(element.props.initialProjectId).toBeNull();
    expect(element.props.returnToProjectId).toBeNull();
  });

  it("redirects unauthenticated users before listing projects", async () => {
    mocks.getCurrentUser.mockResolvedValue(null);

    await expect(NewMeetingPage({ searchParams: Promise.resolve({}) })).rejects.toThrow(
      "REDIRECT:/login",
    );
    expect(mocks.listProjects).not.toHaveBeenCalled();
  });
});

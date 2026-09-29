import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  listProjects: vi.fn(),
}));

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
    mocks.listProjects.mockResolvedValue([{ id: projectId, name: "Forge" }]);

    const globalEditor = await NewMeetingPage({ searchParams: Promise.resolve({}) });
    const projectEditor = await NewMeetingPage({
      searchParams: Promise.resolve({ projectId, returnTo: "project" }),
    });

    expect(globalEditor.key).not.toBe(projectEditor.key);
  });

  it("does not preselect an invalid or unavailable project", async () => {
    mocks.listProjects.mockResolvedValue([{ id: "another-project", name: "Other" }]);

    const element = await NewMeetingPage({
      searchParams: Promise.resolve({ projectId }),
    });

    expect(element.props.initialProjectId).toBeNull();
    expect(element.props.returnToProjectId).toBeNull();
  });
});

import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  notFound: vi.fn(),
  redirect: vi.fn(),
  getProject: vi.fn(),
  fetchTicketPage: vi.fn(),
}));

vi.mock("next/navigation", () => ({ notFound: mocks.notFound, redirect: mocks.redirect }));
vi.mock("@/features/auth/server", () => ({ getCurrentUser: mocks.getCurrentUser }));
vi.mock("@/features/dev-board/components/project-board", () => ({
  ProjectBoard: () => null,
}));
vi.mock("@/features/dev-board/services/projects-service", () => ({
  projectsService: { getProject: mocks.getProject },
}));
vi.mock("@/features/dev-board/services/dev-board-service", () => ({
  devBoardService: { fetchTicketPage: mocks.fetchTicketPage },
}));

import type { Project } from "@/features/dev-board/types/project";
import DevBoardProjectPage from "./page";

const project: Project = {
  id: "project-1",
  name: "Forge",
  description: "Dev tools",
  status: "paused",
  createdAt: "2026-09-23T00:00:00.000Z",
};

describe("DevBoardProjectPage status", () => {
  it("passes the persisted project status through to the board", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: "user-1" });
    mocks.getProject.mockResolvedValue(project);
    mocks.fetchTicketPage.mockResolvedValue({ tickets: [], total: 0, nextCursor: null });

    const element = await DevBoardProjectPage({
      params: Promise.resolve({ projectId: project.id }),
    });

    expect(element.props.project).toEqual(project);
    expect(element.props.project.status).toBe("paused");
  });
});

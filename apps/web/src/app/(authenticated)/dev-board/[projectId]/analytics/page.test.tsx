import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  notFound: vi.fn(() => {
    throw new Error("NOT_FOUND");
  }),
  getProject: vi.fn(),
  fetchAnalytics: vi.fn(),
}));

vi.mock("next/navigation", () => ({ notFound: mocks.notFound }));
vi.mock("@/features/dev-board/components/project-analytics", () => ({
  ProjectAnalytics: () => null,
}));
vi.mock("@/features/dev-board/services/projects-service", () => ({
  projectsService: { getProject: mocks.getProject },
}));
vi.mock("@/features/dev-board/services/dev-board-analytics-service", () => ({
  devBoardAnalyticsService: { fetchAnalytics: mocks.fetchAnalytics },
}));

import type { Project } from "@/features/dev-board/types/project";
import DevBoardAnalyticsPage from "./page";

const project: Project = {
  id: "project-1",
  name: "Forge",
  description: "Dev tools",
  status: "in_progress",
  createdAt: "2026-09-23T00:00:00.000Z",
};

beforeEach(() => vi.clearAllMocks());

function renderPage() {
  return DevBoardAnalyticsPage({
    params: Promise.resolve({ projectId: project.id }),
    searchParams: Promise.resolve({}),
  });
}

describe("DevBoardAnalyticsPage project lookup", () => {
  it("uses not-found when the project is missing", async () => {
    mocks.getProject.mockResolvedValue(null);

    await expect(renderPage()).rejects.toThrow("NOT_FOUND");
    expect(mocks.notFound).toHaveBeenCalledOnce();
    expect(mocks.fetchAnalytics).not.toHaveBeenCalled();
  });

  it("lets project lookup failures reach the route error boundary", async () => {
    const error = new Error("Database unavailable");
    mocks.getProject.mockRejectedValue(error);

    await expect(renderPage()).rejects.toBe(error);
    expect(mocks.notFound).not.toHaveBeenCalled();
  });

  it("loads analytics when the project exists", async () => {
    mocks.getProject.mockResolvedValue(project);
    mocks.fetchAnalytics.mockResolvedValue({});

    const element = await renderPage();

    expect(element.props.project).toEqual(project);
    expect(mocks.fetchAnalytics).toHaveBeenCalledOnce();
  });
});

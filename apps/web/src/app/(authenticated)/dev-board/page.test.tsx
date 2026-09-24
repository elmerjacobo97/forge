import { describe, expect, it, vi } from "vitest";

const listProjects = vi.hoisted(() => vi.fn());
vi.mock("@/features/dev-board/services/projects-service", () => ({
  projectsService: { listProjects },
}));
vi.mock("@/features/dev-board/components/project-list", () => ({
  ProjectList: () => null,
}));

import type { Project } from "@/features/dev-board/types/project";
import DevBoardPage from "./page";

const projects: Project[] = [
  {
    id: "ongoing",
    name: "Forge",
    description: "Dev tools and board",
    status: "in_progress",
    createdAt: "2026-09-04T00:00:00.000Z",
  },
  {
    id: "planned",
    name: "Notes",
    description: "Personal notes",
    status: "planned",
    createdAt: "2026-09-03T00:00:00.000Z",
  },
  {
    id: "archived",
    name: "Old Forge",
    description: "Old notes",
    status: "archived",
    createdAt: "2026-09-05T00:00:00.000Z",
  },
];

function projectsFrom(element: Awaited<ReturnType<typeof DevBoardPage>>): Project[] {
  return (element.props as { projects: Project[] }).projects;
}

describe("DevBoardPage project filters", () => {
  it("passes matching projects using search, status, and sort query parameters", async () => {
    listProjects.mockResolvedValue(projects);

    const page = await DevBoardPage({
      searchParams: Promise.resolve({ q: "forge", status: "in_progress", sort: "name" }),
    });

    expect(projectsFrom(page).map(({ id }) => id)).toEqual(["ongoing"]);
  });

  it("hides archived projects when no status filter is selected", async () => {
    listProjects.mockResolvedValue(projects);

    const page = await DevBoardPage({ searchParams: Promise.resolve({}) });

    expect(projectsFrom(page).map(({ id }) => id)).toEqual(["ongoing", "planned"]);
  });

  it("returns archived projects when the archive filter is selected", async () => {
    listProjects.mockResolvedValue(projects);

    const page = await DevBoardPage({ searchParams: Promise.resolve({ status: "archived" }) });

    expect(projectsFrom(page).map(({ id }) => id)).toEqual(["archived"]);
  });
});

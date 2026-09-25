// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { toast } from "sonner";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  createProjectAction: vi.fn(),
  updateProjectAction: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  usePathname: () => "/dev-board",
  useRouter: () => ({ push: mocks.push }),
}));
vi.mock("../actions", () => ({
  createProjectAction: mocks.createProjectAction,
  updateProjectAction: mocks.updateProjectAction,
}));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
vi.mock("./delete-project-dialog", () => ({ DeleteProjectDialog: () => null }));
vi.mock("./project-form", () => ({ ProjectForm: () => null }));

import type { ProjectFilters } from "../schemas/project-filters";
import type { Project } from "../types/project";
import { ProjectList } from "./project-list";

const filters: ProjectFilters = { q: "", status: "all", sort: "status" };
const project: Project = {
  id: "project-1",
  name: "Forge",
  description: "Tools for software development",
  status: "in_progress",
  createdAt: "2026-09-23T00:00:00.000Z",
};

beforeEach(() => {
  vi.clearAllMocks();
  HTMLElement.prototype.scrollIntoView = vi.fn();
});

describe("ProjectList", () => {
  it("renders project details in a table with board and row actions", () => {
    render(
      <ProjectList
        projects={[project]}
        filters={filters}
        hasAnyProjects
      />,
    );

    expect(screen.getByRole("table")).toBeTruthy();
    expect(screen.getByRole("columnheader", { name: "Project" })).toBeTruthy();
    expect(screen.getByRole("columnheader", { name: "Status" })).toBeTruthy();
    expect(screen.getByRole("columnheader", { name: "Created" })).toBeTruthy();
    expect(screen.getByRole("link", { name: /Forge/ }).getAttribute("href")).toBe(
      "/dev-board/project-1",
    );
    expect(screen.getByText("Tools for software development")).toBeTruthy();
    const compactCreatedDate = screen
      .getAllByText(/Created/)
      .find((element) => element.tagName === "SPAN");
    const desktopCreatedDate = screen
      .getAllByRole("cell")
      .find(
        (cell) => cell.className.includes("hidden") && cell.className.includes("sm:table-cell"),
      );
    expect(compactCreatedDate?.className).toContain("sm:hidden");
    expect(desktopCreatedDate?.className).toContain("sm:table-cell");
    expect(screen.getByRole("combobox", { name: "Change status for Forge" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Actions for Forge" })).toBeTruthy();
    const inbox = screen.getByRole("link", { name: "Inbox" });
    const newProject = screen.getByRole("button", { name: "New project" });
    expect(inbox.getAttribute("href")).toBe("/dev-board/inbox");
    expect(
      inbox.compareDocumentPosition(newProject) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("lets a table row update status directly", async () => {
    const archivedProject: Project = { ...project, status: "archived" };
    mocks.updateProjectAction.mockResolvedValue({
      ok: true,
      data: { ...archivedProject, status: "paused" },
    });
    render(
      <ProjectList
        projects={[archivedProject]}
        filters={filters}
        hasAnyProjects
      />,
    );

    fireEvent.click(screen.getByRole("combobox", { name: "Change status for Forge" }));
    fireEvent.click(screen.getByRole("option", { name: "Paused" }));

    await waitFor(() =>
      expect(mocks.updateProjectAction).toHaveBeenCalledWith("project-1", {
        name: "Forge",
        description: "Tools for software development",
        status: "paused",
      }),
    );
    expect(toast.success).toHaveBeenCalledWith("Project status updated.");
  });

  it("shows a recoverable empty state when filters have no matches", () => {
    render(
      <ProjectList
        projects={[]}
        filters={{ ...filters, q: "missing" }}
        hasAnyProjects
      />,
    );

    expect(screen.getByText("No projects match your filters")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(mocks.push).toHaveBeenCalledWith("/dev-board");
  });

  it("offers project creation when the account has no projects", () => {
    render(
      <ProjectList
        projects={[]}
        filters={filters}
        hasAnyProjects={false}
      />,
    );

    expect(screen.getByText("No projects yet")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Create project" })).toBeTruthy();
  });
});

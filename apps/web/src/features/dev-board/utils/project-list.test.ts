import { describe, expect, it } from "vitest";

import { parseProjectFilters } from "../schemas/project-filters";
import type { Project } from "../types/project";
import { filterAndSortProjects } from "./project-list";

const projects: Project[] = [
  {
    id: "planned-old",
    name: "Alpha",
    description: "Planning the web app",
    status: "planned",
    createdAt: "2026-09-01T00:00:00.000Z",
  },
  {
    id: "paused-new",
    name: "Zulu",
    description: "Paused migration",
    status: "paused",
    createdAt: "2026-09-03T00:00:00.000Z",
  },
  {
    id: "progress-new",
    name: "Forge",
    description: "Development tools",
    status: "in_progress",
    createdAt: "2026-09-04T00:00:00.000Z",
  },
  {
    id: "progress-old",
    name: "Beta",
    description: "Development board",
    status: "in_progress",
    createdAt: "2026-09-02T00:00:00.000Z",
  },
  {
    id: "completed",
    name: "Archive importer",
    description: "Completed maintenance",
    status: "completed",
    createdAt: "2026-09-05T00:00:00.000Z",
  },
  {
    id: "archived",
    name: "Old Forge",
    description: "Archived notes",
    status: "archived",
    createdAt: "2026-09-06T00:00:00.000Z",
  },
];

describe("filterAndSortProjects", () => {
  it("searches names and descriptions without showing archived projects by default", () => {
    const result = filterAndSortProjects(projects, parseProjectFilters({ q: "  DEVELOPMENT " }));

    expect(result.map((project) => project.id)).toEqual(["progress-new", "progress-old"]);
  });

  it("shows archived projects only when archived is selected", () => {
    expect(
      filterAndSortProjects(projects, parseProjectFilters({})).map(({ id }) => id),
    ).not.toContain("archived");
    expect(
      filterAndSortProjects(projects, parseProjectFilters({ status: "archived" })).map(
        ({ id }) => id,
      ),
    ).toEqual(["archived"]);
  });

  it("applies the default status order and sorts newest first within each status", () => {
    const result = filterAndSortProjects(projects, parseProjectFilters({}));

    expect(result.map((project) => project.id)).toEqual([
      "progress-new",
      "progress-old",
      "planned-old",
      "paused-new",
      "completed",
    ]);
  });

  it("sorts alphabetically by name", () => {
    const result = filterAndSortProjects(projects, parseProjectFilters({ sort: "name" }));

    expect(result.map((project) => project.id)).toEqual([
      "planned-old",
      "completed",
      "progress-old",
      "progress-new",
      "paused-new",
    ]);
  });

  it("sorts by creation date newest first", () => {
    const result = filterAndSortProjects(projects, parseProjectFilters({ sort: "created" }));

    expect(result.map((project) => project.id)).toEqual([
      "completed",
      "progress-new",
      "paused-new",
      "progress-old",
      "planned-old",
    ]);
  });
});

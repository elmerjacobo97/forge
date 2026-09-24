import type { Project } from "../types/project";
import type { ProjectFilters } from "../schemas/project-filters";

const DEFAULT_STATUS_ORDER: Project["status"][] = [
  "in_progress",
  "planned",
  "paused",
  "completed",
  "archived",
];

function compareNames(left: Project, right: Project): number {
  return left.name.localeCompare(right.name, undefined, { sensitivity: "base" });
}

function compareCreatedAtNewestFirst(left: Project, right: Project): number {
  return Date.parse(right.createdAt) - Date.parse(left.createdAt);
}

export function filterAndSortProjects(projects: Project[], filters: ProjectFilters): Project[] {
  const query = filters.q.toLocaleLowerCase();
  const filtered = projects.filter((project) => {
    if (
      filters.status === "all" ? project.status === "archived" : project.status !== filters.status
    ) {
      return false;
    }

    return (
      query.length === 0 ||
      project.name.toLocaleLowerCase().includes(query) ||
      project.description.toLocaleLowerCase().includes(query)
    );
  });

  return filtered.sort((left, right) => {
    if (filters.sort === "name") {
      return compareNames(left, right) || compareCreatedAtNewestFirst(left, right);
    }
    if (filters.sort === "created") {
      return compareCreatedAtNewestFirst(left, right) || compareNames(left, right);
    }

    return (
      DEFAULT_STATUS_ORDER.indexOf(left.status) - DEFAULT_STATUS_ORDER.indexOf(right.status) ||
      compareCreatedAtNewestFirst(left, right) ||
      compareNames(left, right)
    );
  });
}

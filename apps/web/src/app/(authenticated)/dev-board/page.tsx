import { ProjectList } from "@/features/dev-board/components/project-list";
import { parseProjectFilters } from "@/features/dev-board/schemas/project-filters";
import { projectsService } from "@/features/dev-board/services/projects-service";
import { filterAndSortProjects } from "@/features/dev-board/utils/project-list";

export default async function DevBoardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [params, allProjects] = await Promise.all([searchParams, projectsService.listProjects()]);
  const filters = parseProjectFilters(params);
  const projects = filterAndSortProjects(allProjects, filters);

  return (
    <ProjectList
      projects={projects}
      filters={filters}
      hasAnyProjects={allProjects.length > 0}
    />
  );
}

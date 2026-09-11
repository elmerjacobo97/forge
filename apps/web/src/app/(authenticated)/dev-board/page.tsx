import { ProjectList } from "@/features/dev-board/components/project-list";
import { projectsService } from "@/features/dev-board/services/projects-service";

export default async function DevBoardPage() {
  const projects = await projectsService.listProjects();

  return <ProjectList projects={projects} />;
}

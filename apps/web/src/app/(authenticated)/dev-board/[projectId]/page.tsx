import { notFound } from "next/navigation";

import { ProjectBoard } from "@/features/dev-board/components/project-board";
import { devBoardService } from "@/features/dev-board/services/dev-board-service";
import { projectsService } from "@/features/dev-board/services/projects-service";
import { COLUMNS } from "@/features/dev-board/types/board";

export default async function DevBoardProjectPage({ params }: PageProps<"/dev-board/[projectId]">) {
  const { projectId } = await params;
  const project = await projectsService.getProject(projectId).catch(() => null);
  if (!project) notFound();

  const initialColumns = await Promise.all(
    COLUMNS.map(async (column) => {
      const page = await devBoardService.fetchTicketPage(projectId, column, null);
      return { column, ...page };
    }),
  );

  return (
    <ProjectBoard
      project={project}
      initialColumns={initialColumns}
    />
  );
}

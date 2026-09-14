import { notFound, redirect } from "next/navigation";

import { getCurrentUser } from "@/features/auth/server";
import { ProjectBoard } from "@/features/dev-board/components/project-board";
import { devBoardService } from "@/features/dev-board/services/dev-board-service";
import { projectsService } from "@/features/dev-board/services/projects-service";
import { COLUMNS } from "@/features/dev-board/types/board";

export default async function DevBoardProjectPage({ params }: PageProps<"/dev-board/[projectId]">) {
  const { projectId } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

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
      userId={user.id}
      initialColumns={initialColumns}
    />
  );
}

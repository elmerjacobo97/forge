import { notFound, redirect } from "next/navigation";
import { z } from "zod";

import { getCurrentUser } from "@/features/auth/server";
import { ProjectBoard } from "@/features/dev-board/components/project-board";
import { devBoardService } from "@/features/dev-board/services/dev-board-service";
import { projectsService } from "@/features/dev-board/services/projects-service";
import { COLUMNS, type Ticket } from "@/features/dev-board/types/board";

function ticketIdFromQuery(value: string | string[] | undefined): string | null {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = z.uuid().safeParse(raw);
  return parsed.success ? parsed.data : null;
}

export default async function DevBoardProjectPage({
  params,
  searchParams,
}: PageProps<"/dev-board/[projectId]">) {
  const { projectId } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const project = await projectsService.getProject(projectId).catch(() => null);
  if (!project) notFound();

  const ticketId = ticketIdFromQuery((await searchParams).ticket);
  const [initialColumns, loadedTicket] = await Promise.all([
    Promise.all(
      COLUMNS.map(async (column) => {
        const page = await devBoardService.fetchTicketPage(projectId, column, null);
        return { column, ...page };
      }),
    ),
    ticketId ? devBoardService.getTicket(ticketId) : Promise.resolve(null),
  ]);
  const initialTicket: Ticket | null = loadedTicket?.projectId === projectId ? loadedTicket : null;

  return (
    <ProjectBoard
      project={project}
      userId={user.id}
      initialColumns={initialColumns}
      initialTicket={initialTicket}
    />
  );
}

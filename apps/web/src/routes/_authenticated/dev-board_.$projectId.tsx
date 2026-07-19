import { createFileRoute } from "@tanstack/react-router";

import { ProjectBoard } from "@/features/dev-board/components/project-board";

export const Route = createFileRoute("/_authenticated/dev-board_/$projectId")({
  component: DevBoardProjectRoute,
});

function DevBoardProjectRoute() {
  const { projectId } = Route.useParams();
  return <ProjectBoard projectId={projectId} />;
}

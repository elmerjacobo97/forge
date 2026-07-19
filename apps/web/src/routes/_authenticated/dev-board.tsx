import { createFileRoute } from "@tanstack/react-router";

import { ProjectList } from "@/features/dev-board/components/project-list";

export const Route = createFileRoute("/_authenticated/dev-board")({
  component: DevBoardProjectsRoute,
});

function DevBoardProjectsRoute() {
  return <ProjectList />;
}

import { createFileRoute } from "@tanstack/react-router";

import { ProjectAnalytics } from "@/features/dev-board/components/project-analytics";

export const Route = createFileRoute("/_authenticated/dev-board/$projectId/analytics")({
  component: DevBoardProjectAnalyticsRoute,
});

function DevBoardProjectAnalyticsRoute() {
  const { projectId } = Route.useParams();
  return <ProjectAnalytics projectId={projectId} />;
}

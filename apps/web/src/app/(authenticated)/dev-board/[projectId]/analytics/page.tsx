import { notFound } from "next/navigation";

import { ProjectAnalytics } from "@/features/dev-board/components/project-analytics";
import { devBoardAnalyticsService } from "@/features/dev-board/services/dev-board-analytics-service";
import { projectsService } from "@/features/dev-board/services/projects-service";
import { presetRange } from "@/features/dev-board/utils/analytics";

export default async function DevBoardAnalyticsPage({
  params,
}: PageProps<"/dev-board/[projectId]/analytics">) {
  const { projectId } = await params;
  const project = await projectsService.getProject(projectId).catch(() => null);
  if (!project) notFound();

  const initialRange = presetRange("30d");
  const initialAnalytics = await devBoardAnalyticsService.fetchAnalytics(projectId, initialRange);

  return (
    <ProjectAnalytics
      project={project}
      initialRange={initialRange}
      initialAnalytics={initialAnalytics}
    />
  );
}

import { ProjectAnalytics } from "@/features/dev-board/components/project-analytics";

export default async function DevBoardAnalyticsPage({
  params,
}: PageProps<"/dev-board/[projectId]/analytics">) {
  const { projectId } = await params;
  return <ProjectAnalytics projectId={projectId} />;
}

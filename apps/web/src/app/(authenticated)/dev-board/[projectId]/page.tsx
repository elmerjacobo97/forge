import { ProjectBoard } from "@/features/dev-board/components/project-board";

export default async function DevBoardProjectPage({
  params,
}: PageProps<"/dev-board/[projectId]">) {
  const { projectId } = await params;
  return <ProjectBoard projectId={projectId} />;
}

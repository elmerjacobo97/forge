import { notFound, redirect } from "next/navigation";

import { getCurrentUser } from "@/features/auth/server";
import { projectsService } from "@/features/dev-board/services/projects-service";
import { ProjectMapView } from "@/features/project-map/components/project-map-view";
import { parseMapParams } from "@/features/project-map/schemas/map-params";
import { projectMapService } from "@/features/project-map/services/project-map-service";

export default async function ProjectFlowsPage({
  params,
  searchParams,
}: PageProps<"/dev-board/[projectId]/flows">) {
  const [{ projectId }, user, query] = await Promise.all([params, getCurrentUser(), searchParams]);
  if (!user) redirect("/login");

  const project = await projectsService.getProject(projectId);
  if (!project) notFound();

  const mapParams = parseMapParams(query);
  const [map, flow] = await Promise.all([
    projectMapService.getMap(projectId),
    mapParams.flowSlug ? projectMapService.getFlow(projectId, mapParams.flowSlug) : null,
  ]);

  return (
    <ProjectMapView
      project={project}
      map={map}
      params={mapParams}
      flow={flow}
    />
  );
}

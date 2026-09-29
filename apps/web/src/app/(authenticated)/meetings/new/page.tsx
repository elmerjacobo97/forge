import { z } from "zod";

import { MeetingEditor } from "@/features/meetings/components/meeting-editor";
import { projectsService } from "@/features/dev-board/services/projects-service";

export default async function NewMeetingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [params, projects] = await Promise.all([searchParams, projectsService.listProjects()]);
  const rawProjectId = typeof params.projectId === "string" ? params.projectId : undefined;
  const parsedProjectId = z.uuid().safeParse(rawProjectId);
  const projectId = parsedProjectId.success
    ? (projects.find((project) => project.id === parsedProjectId.data)?.id ?? null)
    : null;
  const returnToProjectId = params.returnTo === "project" ? projectId : null;
  const initialMeetingAt = new Date().toISOString();
  const editorKey = `new-${projectId ?? "none"}-${returnToProjectId ?? "meetings"}-${initialMeetingAt}`;

  return (
    <MeetingEditor
      key={editorKey}
      initialMeeting={null}
      projects={projects}
      initialProjectId={projectId}
      returnToProjectId={returnToProjectId}
      initialMeetingAt={initialMeetingAt}
    />
  );
}

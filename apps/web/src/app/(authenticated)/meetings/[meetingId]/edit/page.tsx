import { notFound } from "next/navigation";
import { z } from "zod";

import { MeetingEditor } from "@/features/meetings/components/meeting-editor";
import { meetingsService } from "@/features/meetings/services/meetings-service";
import { projectsService } from "@/features/dev-board/services/projects-service";

export default async function EditMeetingPage({
  params,
}: {
  params: Promise<{ meetingId: string }>;
}) {
  const { meetingId: rawMeetingId } = await params;
  const parsedId = z.uuid().safeParse(rawMeetingId);
  if (!parsedId.success) notFound();

  const [meeting, projects] = await Promise.all([
    meetingsService.getMeeting(parsedId.data),
    projectsService.listProjects(),
  ]);
  if (!meeting) notFound();

  return (
    <MeetingEditor
      key={meeting.id}
      initialMeeting={meeting}
      projects={projects}
    />
  );
}

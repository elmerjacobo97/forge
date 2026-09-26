import { RouteLoading } from "@/components/layout/route-loading";
import { MeetingEditorSkeleton } from "@/features/meetings/components/meeting-editor-skeleton";

export default function NewMeetingLoading() {
  return (
    <RouteLoading label="the meeting editor">
      <MeetingEditorSkeleton />
    </RouteLoading>
  );
}

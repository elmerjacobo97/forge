import { RouteLoading } from "@/components/layout/route-loading";
import { MeetingEditorSkeleton } from "@/features/meetings/components/meeting-editor-skeleton";

export default function MeetingDetailLoading() {
  return (
    <RouteLoading label="this meeting">
      <MeetingEditorSkeleton />
    </RouteLoading>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { useMeetingForm } from "../hooks/use-meeting-form";
import type { Meeting } from "../types";
import type { Project } from "@/features/dev-board/types/project";
import { DeleteMeetingDialog } from "./delete-meeting-dialog";
import { MeetingDetailsSection } from "./meeting-details-section";
import { MeetingEditorHeader } from "./meeting-editor-header";
import { MeetingNotesSection } from "./meeting-notes-section";

type MeetingEditorProps = {
  projects: Project[];
} & (
  | {
      initialMeeting: null;
      initialProjectId?: string | null;
      returnToProjectId?: string | null;
      initialMeetingAt: string;
    }
  | {
      initialMeeting: Meeting;
      initialProjectId?: never;
      returnToProjectId?: never;
      initialMeetingAt?: never;
    }
);

function resolveEditorProps(props: MeetingEditorProps) {
  if (props.initialMeeting === null) {
    return {
      initialMeeting: null,
      initialProjectId: props.initialProjectId ?? null,
      returnToProjectId: props.returnToProjectId ?? null,
      initialMeetingAt: props.initialMeetingAt,
    };
  }
  return {
    initialMeeting: props.initialMeeting,
    initialProjectId: null,
    returnToProjectId: null,
    initialMeetingAt: props.initialMeeting.meetingAt,
  };
}

export function MeetingEditor(props: MeetingEditorProps) {
  const { projects } = props;
  const { initialMeeting, initialProjectId, returnToProjectId, initialMeetingAt } =
    resolveEditorProps(props);
  const router = useRouter();
  const meeting = initialMeeting;
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const { form, isSaving } = useMeetingForm({
    initialMeeting,
    initialProjectId,
    initialMeetingAt,
    returnToProjectId,
  });

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 pb-8">
      <MeetingEditorHeader
        form={form}
        isEditing={meeting !== null}
        isSaving={isSaving}
        onDelete={meeting ? () => setIsDeleteOpen(true) : null}
      />

      <form
        id="meeting-form"
        action={() => form.handleSubmit()}
        className="space-y-8"
      >
        <MeetingDetailsSection
          form={form}
          projects={projects}
        />
        <MeetingNotesSection form={form} />
      </form>

      {meeting ? (
        <DeleteMeetingDialog
          meetingId={meeting.id}
          meetingTitle={meeting.title}
          isOpen={isDeleteOpen}
          onOpenChange={setIsDeleteOpen}
          onDeleted={() => router.push("/meetings")}
        />
      ) : null}
    </div>
  );
}

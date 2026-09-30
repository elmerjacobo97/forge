"use client";

import { useEffect, useSyncExternalStore, useTransition } from "react";
import { useForm } from "@tanstack/react-form";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { toast } from "sonner";

import { createMeetingAction, updateMeetingAction } from "../actions";
import { meetingFormSchema, type MeetingFormValues } from "../schemas/meeting";
import type { Meeting } from "../types";

function toLocalDateTime(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : format(date, "yyyy-MM-dd'T'HH:mm");
}

function getMeetingFormDefaults(
  initialMeeting: Meeting | null,
  initialProjectId: string | null,
  initialMeetingAt: string,
  isHydrated: boolean,
): MeetingFormValues {
  return {
    projectId: initialMeeting?.projectId ?? initialProjectId ?? "none",
    title: initialMeeting?.title ?? "",
    meetingAt: isHydrated ? toLocalDateTime(initialMeeting?.meetingAt ?? initialMeetingAt) : "",
    attendees: initialMeeting?.attendees.join("\n") ?? "",
    context: initialMeeting?.context ?? "",
    decisions: initialMeeting?.decisions.join("\n") ?? "",
  };
}

const subscribeToNothing = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export function useMeetingForm({
  initialMeeting,
  initialProjectId,
  initialMeetingAt,
  returnToProjectId,
}: {
  initialMeeting: Meeting | null;
  initialProjectId: string | null;
  initialMeetingAt: string;
  returnToProjectId: string | null;
}) {
  const router = useRouter();
  const isHydrated = useSyncExternalStore(subscribeToNothing, getClientSnapshot, getServerSnapshot);
  const meeting = initialMeeting;
  const [isSaving, startSaving] = useTransition();
  const form = useForm({
    defaultValues: getMeetingFormDefaults(
      initialMeeting,
      initialProjectId,
      initialMeetingAt,
      isHydrated,
    ),
    validators: { onSubmit: meetingFormSchema },
    onSubmit: async ({ value }) => {
      const input = meetingFormSchema.parse(value);
      startSaving(async () => {
        const result = meeting
          ? await updateMeetingAction(meeting.id, input)
          : await createMeetingAction(input);
        if (!result.ok) {
          toast.error(result.message);
          return;
        }

        toast.success(meeting ? "Meeting saved." : "Meeting created.");
        router.replace(
          meeting
            ? `/meetings/${meeting.id}`
            : returnToProjectId
              ? `/dev-board/${returnToProjectId}`
              : "/meetings",
        );
      });
    },
  });
  useEffect(() => {
    form.reset(
      getMeetingFormDefaults(initialMeeting, initialProjectId, initialMeetingAt, isHydrated),
    );
  }, [form, initialMeeting, initialMeetingAt, initialProjectId, isHydrated, returnToProjectId]);

  return { form, isSaving };
}

export type MeetingFormApi = ReturnType<typeof useMeetingForm>["form"];

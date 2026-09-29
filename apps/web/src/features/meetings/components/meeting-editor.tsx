"use client";

import { useEffect, useState, useSyncExternalStore, useTransition } from "react";
import { useForm } from "@tanstack/react-form";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon, Delete02Icon, SaveIcon } from "@hugeicons/core-free-icons";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createMeetingAction, updateMeetingAction } from "../actions";
import { meetingFormSchema, type MeetingFormValues } from "../schemas/meeting";
import type { Meeting } from "../types";
import type { Project } from "@/features/dev-board/types/project";
import { DeleteMeetingDialog } from "./delete-meeting-dialog";

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

export function MeetingEditor(props: MeetingEditorProps) {
  const { projects } = props;
  const initialMeeting = props.initialMeeting;
  const initialProjectId = props.initialMeeting === null ? (props.initialProjectId ?? null) : null;
  const returnToProjectId =
    props.initialMeeting === null ? (props.returnToProjectId ?? null) : null;
  const initialMeetingAt =
    props.initialMeeting === null ? props.initialMeetingAt : props.initialMeeting.meetingAt;
  const router = useRouter();
  const isHydrated = useSyncExternalStore(subscribeToNothing, getClientSnapshot, getServerSnapshot);
  const isEditing = initialMeeting !== null;
  const meeting = initialMeeting;
  const [isSaving, startSaving] = useTransition();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
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

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 pb-8">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 pb-4">
        <div className="min-w-0">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="-ml-2 mb-2 h-8 gap-1.5 px-2 text-muted-foreground"
          >
            <Link href="/meetings">
              <HugeiconsIcon
                icon={ArrowLeft01Icon}
                strokeWidth={2}
                className="size-3.5"
              />
              All meetings
            </Link>
          </Button>
          <p className="text-xs text-muted-foreground">
            {isEditing ? "Meeting record" : "New record"}
          </p>
          <form.Subscribe selector={(state) => state.values.title}>
            {(title) => (
              <h1 className="mt-1 font-heading text-2xl font-semibold tracking-tight">
                {isEditing ? title || "Untitled meeting" : "Capture a meeting"}
              </h1>
            )}
          </form.Subscribe>
        </div>
        <div className="flex items-center gap-2">
          {meeting ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsDeleteOpen(true)}
            >
              <HugeiconsIcon
                icon={Delete02Icon}
                strokeWidth={2}
                className="size-3.5"
              />
              Delete
            </Button>
          ) : null}
          <form.Subscribe selector={(state) => state.values.meetingAt}>
            {(meetingAtValue) => (
              <Button
                type="submit"
                form="meeting-form"
                disabled={isSaving || !meetingAtValue}
                aria-busy={isSaving}
              >
                <HugeiconsIcon
                  icon={SaveIcon}
                  strokeWidth={2}
                  className="size-3.5"
                />
                {isSaving ? "Saving…" : isEditing ? "Save changes" : "Save meeting"}
              </Button>
            )}
          </form.Subscribe>
        </div>
      </header>

      <form
        id="meeting-form"
        onSubmit={(event) => {
          event.preventDefault();
          event.stopPropagation();
          void form.handleSubmit();
        }}
        className="space-y-8"
      >
        <section
          aria-labelledby="meeting-details-heading"
          className="space-y-5"
        >
          <h2
            id="meeting-details-heading"
            className="sr-only"
          >
            Meeting details
          </h2>
          <FieldGroup className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_220px]">
            <form.Field name="title">
              {(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Meeting title</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(event) => field.handleChange(event.target.value)}
                      placeholder="e.g. Product sync — September 26"
                      maxLength={200}
                      aria-invalid={isInvalid}
                      autoComplete="off"
                      className="h-11 font-heading text-lg"
                    />
                    {isInvalid && <FieldError errors={field.state.meta.errors} />}
                  </Field>
                );
              }}
            </form.Field>
            <form.Field name="meetingAt">
              {(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Date and time</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="datetime-local"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(event) => field.handleChange(event.target.value)}
                      required
                      aria-invalid={isInvalid}
                      className="h-11 tabular-nums"
                    />
                    {isInvalid && <FieldError errors={field.state.meta.errors} />}
                  </Field>
                );
              }}
            </form.Field>
            <form.Field name="projectId">
              {(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field
                    data-invalid={isInvalid}
                    className="sm:col-span-2"
                  >
                    <FieldLabel htmlFor={field.name}>
                      Project <span className="font-normal text-muted-foreground">· optional</span>
                    </FieldLabel>
                    <Select
                      value={field.state.value}
                      onValueChange={(value) =>
                        field.handleChange(value as typeof field.state.value)
                      }
                    >
                      <SelectTrigger
                        id={field.name}
                        className="w-full sm:max-w-md"
                        aria-invalid={isInvalid}
                      >
                        <SelectValue placeholder="No project" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No project</SelectItem>
                        {projects.map((project) => (
                          <SelectItem
                            key={project.id}
                            value={project.id}
                          >
                            {project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {isInvalid && <FieldError errors={field.state.meta.errors} />}
                  </Field>
                );
              }}
            </form.Field>
          </FieldGroup>
        </section>

        <section
          aria-labelledby="meeting-context-heading"
          className="space-y-5 border-t border-border/70 pt-6"
        >
          <h2
            id="meeting-context-heading"
            className="sr-only"
          >
            Meeting notes
          </h2>
          <FieldGroup className="grid gap-5 sm:grid-cols-2">
            <form.Field name="attendees">
              {(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>
                      Attendees{" "}
                      <span className="font-normal text-muted-foreground">· optional</span>
                    </FieldLabel>
                    <Textarea
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(event) => field.handleChange(event.target.value)}
                      placeholder="One name per line"
                      rows={3}
                      aria-invalid={isInvalid}
                      className="resize-y"
                    />
                    {isInvalid && <FieldError errors={field.state.meta.errors} />}
                  </Field>
                );
              }}
            </form.Field>
            <form.Field name="decisions">
              {(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>
                      Decisions{" "}
                      <span className="font-normal text-muted-foreground">· one per line</span>
                    </FieldLabel>
                    <Textarea
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(event) => field.handleChange(event.target.value)}
                      placeholder="What did the group decide?"
                      rows={3}
                      aria-invalid={isInvalid}
                      className="resize-y"
                    />
                    {isInvalid && <FieldError errors={field.state.meta.errors} />}
                  </Field>
                );
              }}
            </form.Field>
            <form.Field name="context">
              {(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field
                    data-invalid={isInvalid}
                    className="sm:col-span-2"
                  >
                    <FieldLabel htmlFor={field.name}>Context and notes</FieldLabel>
                    <Textarea
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(event) => field.handleChange(event.target.value)}
                      placeholder="Capture the context worth remembering…"
                      rows={7}
                      aria-invalid={isInvalid}
                      className="min-h-40 resize-y leading-relaxed"
                    />
                    {isInvalid && <FieldError errors={field.state.meta.errors} />}
                  </Field>
                );
              }}
            </form.Field>
          </FieldGroup>
        </section>
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

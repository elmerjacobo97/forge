"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  Calendar03Icon,
  Delete02Icon,
  PencilEdit01Icon,
} from "@hugeicons/core-free-icons";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Meeting } from "../types";
import { DeleteMeetingDialog } from "./delete-meeting-dialog";

function formatMeetingDate(value: string): string {
  return format(new Date(value), "EEEE, MMM d, yyyy · h:mm a");
}

export function MeetingDetail({
  meeting,
  projectName,
}: {
  meeting: Meeting;
  projectName?: string;
}) {
  const router = useRouter();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 pb-8">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border/70 pb-4">
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
          <p className="text-xs text-muted-foreground">Meeting record</p>
          <h1 className="mt-1 font-heading text-2xl font-semibold tracking-tight">
            {meeting.title}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <HugeiconsIcon
                icon={Calendar03Icon}
                strokeWidth={1.8}
                className="size-3.5"
              />
              <time
                dateTime={meeting.meetingAt}
                className="tabular-nums"
              >
                {formatMeetingDate(meeting.meetingAt)}
              </time>
            </span>
            {projectName ? <Badge variant="outline">{projectName}</Badge> : null}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            asChild
            variant="outline"
            size="sm"
          >
            <Link href={`/meetings/${meeting.id}/edit`}>
              <HugeiconsIcon
                icon={PencilEdit01Icon}
                strokeWidth={2}
                className="size-3.5"
              />
              Edit
            </Link>
          </Button>
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
        </div>
      </header>

      <section
        aria-labelledby="meeting-context-heading"
        className="space-y-3"
      >
        <h2
          id="meeting-context-heading"
          className="font-heading text-lg font-semibold tracking-tight"
        >
          Context and notes
        </h2>
        {meeting.context ? (
          <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
            {meeting.context}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">No context recorded.</p>
        )}
      </section>

      <section
        aria-labelledby="meeting-decisions-heading"
        className="space-y-3 border-t border-border/70 pt-6"
      >
        <h2
          id="meeting-decisions-heading"
          className="font-heading text-lg font-semibold tracking-tight"
        >
          Decisions
        </h2>
        {meeting.decisions.length > 0 ? (
          <ul className="space-y-2">
            {meeting.decisions.map((decision) => (
              <li
                key={decision}
                className="border-l-2 border-border py-0.5 pl-3 text-sm leading-relaxed"
              >
                {decision}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No decisions recorded.</p>
        )}
      </section>

      <section
        aria-labelledby="meeting-attendees-heading"
        className="space-y-3 border-t border-border/70 pt-6"
      >
        <h2
          id="meeting-attendees-heading"
          className="font-heading text-lg font-semibold tracking-tight"
        >
          Attendees
        </h2>
        {meeting.attendees.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {meeting.attendees.map((attendee) => (
              <Badge
                key={attendee}
                variant="outline"
              >
                {attendee}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No attendees recorded.</p>
        )}
      </section>

      <DeleteMeetingDialog
        meetingId={meeting.id}
        meetingTitle={meeting.title}
        isOpen={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onDeleted={() => router.push("/meetings")}
      />
    </div>
  );
}

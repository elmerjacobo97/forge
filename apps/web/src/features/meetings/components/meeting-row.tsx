"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Calendar03Icon,
  Delete02Icon,
  MoreHorizontalIcon,
  PencilEdit01Icon,
} from "@hugeicons/core-free-icons";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Meeting } from "../types";
import { DeleteMeetingDialog } from "./delete-meeting-dialog";

function formatMeetingDate(value: string): string {
  return format(new Date(value), "MMM d, yyyy · h:mm a");
}

export function MeetingRow({ meeting, projectName }: { meeting: Meeting; projectName?: string }) {
  const router = useRouter();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  return (
    <div className="group flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-accent/40">
      <Link
        href={`/meetings/${meeting.id}`}
        className="min-w-0 flex-1 space-y-1 outline-none"
      >
        <h3 className="truncate font-medium leading-snug group-hover:underline">{meeting.title}</h3>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <HugeiconsIcon
              icon={Calendar03Icon}
              strokeWidth={1.8}
              className="size-3"
            />
            <time
              dateTime={meeting.meetingAt}
              className="tabular-nums"
            >
              {formatMeetingDate(meeting.meetingAt)}
            </time>
          </span>
          {projectName ? (
            <Badge
              variant="outline"
              className="max-w-40 truncate text-xs"
            >
              {projectName}
            </Badge>
          ) : null}
          {meeting.attendees.length > 0 ? (
            <span>
              {meeting.attendees.length} {meeting.attendees.length === 1 ? "attendee" : "attendees"}
            </span>
          ) : null}
          {meeting.decisions.length > 0 ? (
            <span>
              {meeting.decisions.length} {meeting.decisions.length === 1 ? "decision" : "decisions"}
            </span>
          ) : null}
        </div>
      </Link>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="icon-sm"
            variant="ghost"
            className="text-muted-foreground"
            aria-label={`Actions for ${meeting.title}`}
          >
            <HugeiconsIcon
              icon={MoreHorizontalIcon}
              strokeWidth={2}
              className="size-3.5"
            />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link href={`/meetings/${meeting.id}/edit`}>
              <HugeiconsIcon
                icon={PencilEdit01Icon}
                strokeWidth={2}
                className="size-3.5"
              />
              Edit
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            onClick={() => setIsDeleteOpen(true)}
          >
            <HugeiconsIcon
              icon={Delete02Icon}
              strokeWidth={2}
              className="size-3.5"
            />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {isDeleteOpen ? (
        <DeleteMeetingDialog
          meetingId={meeting.id}
          meetingTitle={meeting.title}
          isOpen
          onOpenChange={setIsDeleteOpen}
          onDeleted={() => router.refresh()}
        />
      ) : null}
    </div>
  );
}

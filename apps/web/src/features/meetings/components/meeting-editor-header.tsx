"use client";

import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon, Delete02Icon, SaveIcon } from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";
import type { MeetingFormApi } from "../hooks/use-meeting-form";

export function MeetingEditorHeader({
  form,
  isEditing,
  isSaving,
  onDelete,
}: {
  form: MeetingFormApi;
  isEditing: boolean;
  isSaving: boolean;
  onDelete: (() => void) | null;
}) {
  return (
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
        {onDelete ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onDelete}
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
  );
}

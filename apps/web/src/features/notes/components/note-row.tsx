"use client";

import { useState } from "react";
import { format } from "date-fns";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowDown01Icon,
  ArrowRight01Icon,
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
import { Markdown } from "@/components/markdown";
import type { Note, NoteProject } from "../types";
import { DeleteNoteDialog } from "./delete-note-dialog";
import { EditNoteDialog } from "./edit-note-dialog";

export function NoteRow({ note, projects }: { note: Note; projects: NoteProject[] }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const projectName = projects.find((project) => project.id === note.projectId)?.name;

  const menuActions = [
    {
      label: "Edit",
      icon: PencilEdit01Icon,
      variant: undefined,
      onSelect: () => setIsEditOpen(true),
    },
    {
      label: "Delete",
      icon: Delete02Icon,
      variant: "destructive" as const,
      onSelect: () => setIsDeleteOpen(true),
    },
  ];

  return (
    <div className="group flex items-start gap-3 px-3 py-2.5 transition-colors hover:bg-accent/40">
      <div className="min-w-0 flex-1 space-y-1">
        <button
          type="button"
          onClick={() => setIsExpanded((value) => !value)}
          aria-expanded={isExpanded}
          className="flex w-full items-center gap-1.5 text-left"
        >
          <HugeiconsIcon
            icon={isExpanded ? ArrowDown01Icon : ArrowRight01Icon}
            strokeWidth={2}
            className="size-3.5 shrink-0 text-muted-foreground"
          />
          <h3 className="truncate font-medium leading-snug">{note.title}</h3>
        </button>
        <div className="flex flex-wrap items-center gap-2 pl-5 text-xs text-muted-foreground">
          {projectName ? (
            <Badge
              variant="outline"
              className="text-xs"
            >
              {projectName}
            </Badge>
          ) : null}
          {note.tags.length ? (
            <span className="font-mono">{note.tags.map((tag) => `#${tag}`).join(" ")}</span>
          ) : null}
          <span>{format(new Date(note.createdAt), "MMM d, yyyy")}</span>
        </div>
        {isExpanded ? (
          <div className="pl-5 pt-1">
            <Markdown content={note.content} />
          </div>
        ) : null}
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="icon-sm"
            variant="ghost"
            className="text-muted-foreground"
            aria-label={`Actions for ${note.title}`}
          >
            <HugeiconsIcon
              icon={MoreHorizontalIcon}
              strokeWidth={2}
              className="size-3.5"
            />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {menuActions.map((action) => (
            <DropdownMenuItem
              key={action.label}
              variant={action.variant}
              onClick={action.onSelect}
            >
              <HugeiconsIcon
                icon={action.icon}
                strokeWidth={2}
                className="size-3.5"
              />
              {action.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {isEditOpen ? (
        <EditNoteDialog
          note={note}
          projects={projects}
          isOpen
          onOpenChange={setIsEditOpen}
        />
      ) : null}

      {isDeleteOpen ? (
        <DeleteNoteDialog
          note={note}
          isOpen
          onOpenChange={setIsDeleteOpen}
        />
      ) : null}
    </div>
  );
}

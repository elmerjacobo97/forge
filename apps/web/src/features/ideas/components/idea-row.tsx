"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Link2, MoreHorizontal, Pencil, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CATEGORIES, STATUSES } from "../constants";
import type { Idea } from "../types";
import { DeleteIdeaDialog } from "./delete-idea-dialog";
import { EditIdeaDialog } from "./edit-idea-dialog";

function getStatusLabel(status: Idea["status"]): string {
  return STATUSES.find((option) => option.value === status)?.label ?? status;
}

function getCategoryLabel(category: Idea["category"]): string {
  return CATEGORIES.find((option) => option.value === category)?.label ?? category;
}

export function IdeaRow({ idea }: { idea: Idea }) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  return (
    <div className="group flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-accent/40">
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate font-medium leading-snug">{idea.title}</h3>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Badge
            variant="outline"
            className="text-xs capitalize"
          >
            {getStatusLabel(idea.status)}
          </Badge>
          <span>{getCategoryLabel(idea.category)}</span>
          {idea.tags.length ? (
            <span className="font-mono">{idea.tags.map((tag) => `#${tag}`).join(" ")}</span>
          ) : null}
          {idea.links.length ? (
            <span className="inline-flex items-center gap-1">
              <Link2 className="size-3" />
              {idea.links.length}
            </span>
          ) : null}
          <span>{format(new Date(idea.createdAt), "MMM d, yyyy")}</span>
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="icon-sm"
            variant="ghost"
            className="text-muted-foreground"
            aria-label={`Actions for ${idea.title}`}
          >
            <MoreHorizontal className="size-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setIsEditOpen(true)}>
            <Pencil className="size-3.5" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            onClick={() => setIsDeleteOpen(true)}
          >
            <Trash2 className="size-3.5" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {isEditOpen ? (
        <EditIdeaDialog
          idea={idea}
          isOpen
          onOpenChange={setIsEditOpen}
        />
      ) : null}

      {isDeleteOpen ? (
        <DeleteIdeaDialog
          idea={idea}
          isOpen
          onOpenChange={setIsDeleteOpen}
        />
      ) : null}
    </div>
  );
}

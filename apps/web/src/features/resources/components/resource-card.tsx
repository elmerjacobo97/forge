"use client";

import { useState } from "react";
import { ExternalLink, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { format } from "date-fns";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DeleteResourceDialog } from "./delete-resource-dialog";
import { EditResourceDialog } from "./edit-resource-dialog";
import type { Resource } from "../types";

export function ResourceCard({ resource }: { resource: Resource }) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  return (
    <div className="group flex flex-col rounded-xl border border-border bg-card p-4 transition-colors hover:border-foreground/20">
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="capitalize"
            >
              {resource.category}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {format(new Date(resource.createdAt), "MMM d, yyyy")}
            </span>
          </div>
          <h3 className="font-heading text-base font-medium leading-snug">{resource.title}</h3>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="icon-sm"
              variant="ghost"
              className="text-muted-foreground"
              aria-label={`Actions for ${resource.title}`}
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
      </div>

      <div className="mt-3 flex-1 space-y-3">
        <p className="text-sm text-muted-foreground">{resource.description}</p>
        <div className="flex flex-wrap gap-1.5">
          {resource.tags.map((t) => (
            <Badge
              key={t}
              variant="secondary"
              className="text-xs font-mono"
            >
              #{t}
            </Badge>
          ))}
        </div>
      </div>

      <div className="mt-4 border-t border-border pt-3">
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => window.open(resource.url, "_blank")}
        >
          Open
          <ExternalLink className="size-3.5" />
        </Button>
      </div>

      {isEditOpen ? (
        <EditResourceDialog
          resource={resource}
          isOpen
          onOpenChange={setIsEditOpen}
        />
      ) : null}

      {isDeleteOpen ? (
        <DeleteResourceDialog
          resource={resource}
          isOpen
          onOpenChange={setIsDeleteOpen}
        />
      ) : null}
    </div>
  );
}

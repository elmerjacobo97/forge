"use client";

import { useCallback, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { PlusSignIcon, Search01Icon } from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUrlSearch } from "@/lib/hooks/use-url-search";
import type { NoteFilters } from "../schemas/note-filters";
import type { NoteProject } from "../types";
import { AddNoteDialog } from "./add-note-dialog";

function buildQuery(filters: NoteFilters): string {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.tag !== "all") params.set("tag", filters.tag);
  if (filters.project !== "all") params.set("project", filters.project);
  return params.toString();
}

export function NotesToolbar({
  filters,
  tags,
  projects,
}: {
  filters: NoteFilters;
  tags: string[];
  projects: NoteProject[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isNavigating, startNavigating] = useTransition();

  const applyFilters = useCallback(
    (next: Partial<NoteFilters>) => {
      const query = buildQuery({ ...filters, ...next });
      startNavigating(() => {
        router.replace(query ? `${pathname}?${query}` : pathname);
      });
    },
    [filters, pathname, router],
  );

  const { value: search, setValue: setSearch } = useUrlSearch(filters.q, (q) =>
    applyFilters({ q }),
  );

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative w-full sm:order-1 sm:w-72">
        <HugeiconsIcon
          icon={Search01Icon}
          strokeWidth={2}
          className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search notes…"
          className="pl-8"
          type="search"
          aria-busy={isNavigating}
        />
      </div>

      <Button
        size="sm"
        onClick={() => setIsAddDialogOpen(true)}
        className="ml-auto sm:order-3"
      >
        <HugeiconsIcon
          icon={PlusSignIcon}
          strokeWidth={2}
          className="size-3.5"
        />
        Add note
      </Button>

      <div className="flex w-full flex-wrap items-center gap-2 sm:order-2 sm:w-auto">
        <Select
          value={filters.project}
          onValueChange={(value) => applyFilters({ project: value })}
        >
          <SelectTrigger
            className="min-w-32"
            aria-label="Filter by project"
          >
            <SelectValue placeholder="Project" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All projects</SelectItem>
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

        <Select
          value={filters.tag}
          onValueChange={(value) => applyFilters({ tag: value })}
        >
          <SelectTrigger
            className="min-w-32"
            aria-label="Filter by tag"
          >
            <SelectValue placeholder="Tag" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All tags</SelectItem>
            {tags.map((tag) => (
              <SelectItem
                key={tag}
                value={tag}
              >
                #{tag}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <AddNoteDialog
        projects={projects}
        isOpen={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
      />
    </div>
  );
}

"use client";

import { useCallback, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { Calendar03Icon, PlusSignIcon, Search01Icon } from "@hugeicons/core-free-icons";

import { ListPagination } from "@/components/list-pagination";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUrlSearch } from "@/lib/hooks/use-url-search";
import type { MeetingFilters } from "../schemas/meeting";
import type { MeetingsPage } from "../types";
import type { Project } from "@/features/dev-board/types/project";
import { MeetingRow } from "./meeting-row";

function buildQuery(filters: MeetingFilters): string {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.projectId) params.set("projectId", filters.projectId);
  return params.toString();
}

export function MeetingsHistory({
  page,
  filters,
  projects,
}: {
  page: MeetingsPage;
  filters: MeetingFilters;
  projects: Project[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isNavigating, startNavigating] = useTransition();
  const applyFilters = useCallback(
    (next: Partial<MeetingFilters>) => {
      const query = buildQuery({ ...filters, ...next });
      startNavigating(() => router.replace(query ? `${pathname}?${query}` : pathname));
    },
    [filters, pathname, router],
  );
  const { value: search, setValue: setSearch } = useUrlSearch(filters.q, (q) =>
    applyFilters({ q }),
  );
  const projectNames = new Map(projects.map((project) => [project.id, project.name]));

  return (
    <div className="flex h-full min-h-0 flex-col gap-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-lg font-medium tracking-tight">Meetings</h1>
          <p className="text-xs text-muted-foreground">
            Decisions, context, and the work that follows each conversation.
          </p>
        </div>
        <Button asChild>
          <Link href="/meetings/new">
            <HugeiconsIcon
              icon={PlusSignIcon}
              strokeWidth={2}
              className="size-4"
            />
            New meeting
          </Link>
        </Button>
      </header>

      <div className="flex flex-col gap-2 border-y border-border/70 py-3 sm:flex-row sm:items-center">
        <div className="relative w-full sm:max-w-sm">
          <HugeiconsIcon
            icon={Search01Icon}
            strokeWidth={2}
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search title or context…"
            aria-label="Search meetings by title or context"
            aria-busy={isNavigating}
            className="pl-9"
          />
        </div>
        <Select
          value={filters.projectId ?? "all"}
          onValueChange={(value) => applyFilters({ projectId: value === "all" ? null : value })}
        >
          <SelectTrigger
            className="w-full sm:ml-auto sm:w-56"
            aria-label="Filter meetings by project"
          >
            <SelectValue placeholder="All projects" />
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
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {page.meetings.length === 0 ? (
          <Empty className="min-h-72 border border-dashed border-border/70 bg-card/40">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <HugeiconsIcon
                  icon={Calendar03Icon}
                  strokeWidth={1.6}
                />
              </EmptyMedia>
              <EmptyTitle>
                {page.total === 0 ? "No meeting notes yet" : "No meetings found"}
              </EmptyTitle>
              <EmptyDescription>
                {page.total === 0
                  ? "Keep meeting context and decisions together. Start with a meeting note."
                  : "Try another search or choose a different project."}
              </EmptyDescription>
            </EmptyHeader>
            {page.total === 0 ? (
              <Button
                asChild
                size="sm"
              >
                <Link href="/meetings/new">Write the first note</Link>
              </Button>
            ) : null}
          </Empty>
        ) : (
          <div className="divide-y divide-border border border-border bg-card">
            {page.meetings.map((meeting) => (
              <MeetingRow
                key={meeting.id}
                meeting={meeting}
                projectName={meeting.projectId ? projectNames.get(meeting.projectId) : undefined}
              />
            ))}
          </div>
        )}
      </div>

      <ListPagination
        loaded={page.meetings.length}
        total={page.total}
      />
    </div>
  );
}

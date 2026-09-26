"use client";

import { useCallback, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { format } from "date-fns";
import { HugeiconsIcon } from "@hugeicons/react";
import { Calendar03Icon, PlusSignIcon, Search01Icon } from "@hugeicons/core-free-icons";

import { ListPagination } from "@/components/list-pagination";
import { Badge } from "@/components/ui/badge";
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
import type { Meeting, MeetingsPage } from "../types";
import type { Project } from "@/features/dev-board/types/project";

function buildQuery(filters: MeetingFilters): string {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.projectId) params.set("projectId", filters.projectId);
  return params.toString();
}

function formatMeetingDate(meetingAt: string): string {
  return format(new Date(meetingAt), "EEE, MMM d, yyyy · h:mm a");
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
          <p className="text-xs text-muted-foreground">Field notes</p>
          <h1 className="mt-1 font-heading text-2xl font-semibold tracking-tight">Meetings</h1>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
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
                  ? "Keep decisions and next steps together. Start with a meeting note."
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
          <div className="mx-auto max-w-4xl">
            <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {page.total} {page.total === 1 ? "entry" : "entries"}
              </span>
              {isNavigating ? <span role="status">Updating…</span> : null}
            </div>
            <ol className="divide-y divide-border/70 border-y border-border/70">
              {page.meetings.map((meeting) => (
                <MeetingHistoryEntry
                  key={meeting.id}
                  meeting={meeting}
                  projectName={meeting.projectId ? projectNames.get(meeting.projectId) : undefined}
                />
              ))}
            </ol>
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

function MeetingHistoryEntry({ meeting, projectName }: { meeting: Meeting; projectName?: string }) {
  return (
    <li>
      <Link
        href={`/meetings/${meeting.id}`}
        className="group grid gap-3 py-4 outline-none transition-colors hover:bg-accent/30 focus-visible:bg-accent/30 sm:grid-cols-[168px_minmax(0,1fr)] sm:gap-6 sm:px-3"
      >
        <div className="flex items-start gap-2 text-xs text-muted-foreground sm:block">
          <HugeiconsIcon
            icon={Calendar03Icon}
            strokeWidth={1.8}
            className="mt-0.5 size-3.5 shrink-0"
          />
          <time
            dateTime={meeting.meetingAt}
            className="tabular-nums"
          >
            {formatMeetingDate(meeting.meetingAt)}
          </time>
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="min-w-0 flex-1 truncate font-heading text-base font-medium tracking-tight group-hover:underline">
              {meeting.title}
            </h2>
            {projectName ? (
              <Badge
                variant="outline"
                className="max-w-40 truncate"
              >
                {projectName}
              </Badge>
            ) : null}
          </div>
          <p className="mt-1 line-clamp-2 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
            {meeting.context || meeting.decisions[0] || "No context recorded."}
          </p>
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
            {meeting.attendees.length > 0 ? (
              <span>
                {meeting.attendees.length}{" "}
                {meeting.attendees.length === 1 ? "attendee" : "attendees"}
              </span>
            ) : null}
            {meeting.decisions.length > 0 ? (
              <span>
                {meeting.decisions.length}{" "}
                {meeting.decisions.length === 1 ? "decision" : "decisions"}
              </span>
            ) : null}
          </div>
        </div>
      </Link>
    </li>
  );
}

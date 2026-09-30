import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Analytics01Icon,
  ArrowLeft01Icon,
  Calendar03Icon,
  PlusSignIcon,
  RefreshIcon,
} from "@hugeicons/core-free-icons";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PROJECT_STATUS_LABELS } from "../types/project";
import type { Project, ProjectStatus } from "../types/project";

const PROJECT_STATUS_BADGE_STYLES: Record<ProjectStatus, string> = {
  planned: "border-border bg-muted/60 text-muted-foreground",
  in_progress: "border-primary/30 bg-primary/10 text-primary",
  paused: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  completed: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  archived: "border-border bg-transparent text-muted-foreground",
};

interface ProjectBoardHeaderProps {
  project: Project;
  ticketCount: number;
  isRefreshing: boolean;
  onRefresh: () => void;
  onNewTicket: () => void;
}

export function ProjectBoardHeader({
  project,
  ticketCount,
  isRefreshing,
  onRefresh,
  onNewTicket,
}: ProjectBoardHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <Button
          asChild
          size="sm"
          variant="ghost"
          className="-ml-2 mb-1 h-7 gap-1.5 px-2"
        >
          <Link href="/dev-board">
            <HugeiconsIcon
              icon={ArrowLeft01Icon}
              strokeWidth={2}
              className="size-3.5"
            />
            Projects
          </Link>
        </Button>
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <h1 className="min-w-0 truncate font-heading text-lg font-medium tracking-tight">
            {project.name}
          </h1>
          <Badge
            variant="outline"
            role="status"
            aria-label={`Project status: ${PROJECT_STATUS_LABELS[project.status]}`}
            className={PROJECT_STATUS_BADGE_STYLES[project.status]}
          >
            {PROJECT_STATUS_LABELS[project.status]}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          {ticketCount} ticket{ticketCount === 1 ? "" : "s"} · drag to move · timer starts in
          &quot;In Progress&quot;
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Button
          type="button"
          size="icon-sm"
          variant="outline"
          onClick={onRefresh}
          disabled={isRefreshing}
          aria-label="Refresh board"
          title="Refresh board"
        >
          <HugeiconsIcon
            icon={RefreshIcon}
            strokeWidth={2}
            className={cn("size-3.5", isRefreshing && "animate-spin")}
          />
        </Button>
        <Button
          asChild
          size="sm"
          variant="outline"
        >
          <Link href={`/dev-board/${project.id}/analytics`}>
            <HugeiconsIcon
              icon={Analytics01Icon}
              strokeWidth={2}
              className="size-3.5"
            />
            Analytics
          </Link>
        </Button>
        <Button
          asChild
          size="sm"
          variant="outline"
        >
          <Link href={`/meetings/new?projectId=${project.id}&returnTo=project`}>
            <HugeiconsIcon
              icon={Calendar03Icon}
              strokeWidth={2}
              className="size-3.5"
            />
            New meeting
          </Link>
        </Button>
        <Button
          size="sm"
          onClick={onNewTicket}
          className="gap-1.5"
        >
          <HugeiconsIcon
            icon={PlusSignIcon}
            strokeWidth={2}
            className="size-3.5"
          />
          New Ticket
        </Button>
      </div>
    </div>
  );
}

import { HugeiconsIcon } from "@hugeicons/react";
import { Calendar03Icon, Clock01Icon, Message01Icon } from "@hugeicons/core-free-icons";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import {
  type Ticket,
  type TicketComplexity,
  COMPLEXITY_LABELS,
  COMPLEXITY_LEVELS,
} from "../types/board";
import { formatLocalDateTime } from "../utils/planning-dates";
import { formatDuration } from "../utils/timer";

export function TicketComplexityBadge({ complexity }: { complexity: TicketComplexity }) {
  return (
    <Badge
      variant="secondary"
      aria-label={`${COMPLEXITY_LABELS[complexity]} complexity`}
    >
      <span
        aria-hidden
        className="flex items-end gap-px"
      >
        {[0, 1, 2].map((level) => (
          <span
            key={level}
            className={cn(
              "w-0.5 bg-muted-foreground/30",
              level === 0 && "h-1.5",
              level === 1 && "h-2",
              level === 2 && "h-2.5",
              level <= COMPLEXITY_LEVELS.indexOf(complexity) && "bg-foreground",
            )}
          />
        ))}
      </span>
      {COMPLEXITY_LABELS[complexity]}
    </Badge>
  );
}

export function TicketDateRange({
  ticket,
  dateRange,
  overdue,
}: {
  ticket: Ticket;
  dateRange: string;
  overdue: boolean;
}) {
  return (
    <span
      className={cn(
        "flex items-center gap-1 text-[11px] tabular-nums text-muted-foreground",
        overdue && "text-destructive",
      )}
      title={[formatLocalDateTime(ticket.startDate), formatLocalDateTime(ticket.dueDate)]
        .filter(Boolean)
        .join(" → ")}
    >
      <HugeiconsIcon
        icon={Calendar03Icon}
        strokeWidth={2}
        className="size-3"
      />
      {ticket.startDate && (
        <time
          dateTime={ticket.startDate}
          className="sr-only"
        >
          {formatLocalDateTime(ticket.startDate)}
        </time>
      )}
      {ticket.dueDate && (
        <time
          dateTime={ticket.dueDate}
          className="sr-only"
        >
          {formatLocalDateTime(ticket.dueDate)}
        </time>
      )}
      <span aria-hidden>{dateRange}</span>
    </span>
  );
}

export function TicketCardFooter({
  ticket,
  hasTimer,
  timerRunning,
  elapsed,
  commentCount,
}: {
  ticket: Ticket;
  hasTimer: boolean;
  timerRunning: boolean;
  elapsed: number;
  commentCount: number;
}) {
  return (
    <div className="mt-2.5 flex items-center gap-2.5 border-t border-border/50 pt-2">
      {ticket.responsibleName && (
        <span
          className="min-w-0 truncate text-[11px] text-muted-foreground"
          title={ticket.responsibleName}
        >
          <span className="font-medium">Resp.</span> {ticket.responsibleName}
        </span>
      )}
      {hasTimer && (
        <span className="flex items-center gap-1">
          <HugeiconsIcon
            icon={Clock01Icon}
            strokeWidth={2}
            className={cn(
              "size-3 text-muted-foreground",
              timerRunning && "animate-pulse text-primary",
            )}
          />
          <span
            className={cn(
              "font-mono text-[11px] tabular-nums text-muted-foreground",
              timerRunning && "text-primary",
            )}
          >
            {formatDuration(elapsed)}
          </span>
        </span>
      )}
      {commentCount > 0 && (
        <span
          className="ml-auto flex items-center gap-1 text-[11px] tabular-nums text-muted-foreground"
          aria-label={`${commentCount} comment${commentCount === 1 ? "" : "s"}`}
        >
          <HugeiconsIcon
            icon={Message01Icon}
            strokeWidth={2}
            className="size-3"
          />
          {commentCount}
        </span>
      )}
    </div>
  );
}

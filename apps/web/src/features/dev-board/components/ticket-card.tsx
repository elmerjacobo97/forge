/* eslint-disable react-hooks/refs -- @dnd-kit/sortable exposes refs/listeners that must be applied during render */
import { useSyncExternalStore } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Calendar03Icon,
  Clock01Icon,
  Copy01Icon,
  Delete02Icon,
  GripVerticalIcon,
  Message01Icon,
  MoreHorizontalIcon,
  PauseIcon,
  PencilEdit01Icon,
  PlayIcon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useClock } from "@/lib/hooks/use-clock";
import { useCopy } from "@/lib/hooks/use-copy";

import {
  type ColumnId,
  type Priority,
  type Ticket,
  type TicketComplexity,
  COLUMN_LABELS,
  COLUMNS,
  COMPLEXITY_LABELS,
  COMPLEXITY_LEVELS,
  isTimerColumn,
  PRIORITY_COLORS,
  PRIORITY_LABELS,
} from "../types/board";
import { formatLocalDateTime, formatShortDateRange, isOverdue } from "../utils/planning-dates";
import { computeElapsed, formatDuration, pauseTimer, resumeTimer } from "../utils/timer";

function subscribeClientRender(): () => void {
  return () => {};
}

function getClientRenderSnapshot(): boolean {
  return true;
}

function getServerRenderSnapshot(): boolean {
  return false;
}

interface TicketCardProps {
  ticket: Ticket;
  onEdit: (ticket: Ticket) => void;
  onComments: (ticket: Ticket) => void;
  onAdjust: (ticket: Ticket) => void;
  onMoveToColumn: (id: string, column: ColumnId) => void;
  onUpdate: (ticket: Ticket) => void;
  onDelete: (ticket: Ticket) => void;
}

export function TicketCard({
  ticket,
  onEdit,
  onComments,
  onAdjust,
  onMoveToColumn,
  onUpdate,
  onDelete,
}: TicketCardProps) {
  const sortable = useSortable({
    id: ticket.id,
  });

  const { copied, copy } = useCopy();
  const hasMounted = useSyncExternalStore(
    subscribeClientRender,
    getClientRenderSnapshot,
    getServerRenderSnapshot,
  );

  const style = {
    transform: CSS.Translate.toString(sortable.transform),
    transition: sortable.transition,
  };

  const timerActive = isTimerColumn(ticket.column);
  const timerRunning = timerActive && ticket.timerStartedAt !== null && !ticket.isPaused;
  const timerPaused = timerActive && ticket.isPaused;

  const now = useClock(timerRunning);
  const elapsed = now === null ? ticket.totalElapsedMs : computeElapsed(ticket, now);

  const dateRange = hasMounted ? formatShortDateRange(ticket.startDate, ticket.dueDate) : null;
  const overdue = hasMounted && isOverdue(ticket.dueDate, ticket.column === "done");
  const hasTimer = timerActive || ticket.totalElapsedMs > 0;
  const commentCount = ticket.commentCount ?? 0;
  const hasFooter = Boolean(ticket.responsibleName) || hasTimer || commentCount > 0;

  return (
    <div
      ref={sortable.setNodeRef}
      style={style}
      className={cn(
        "group relative border border-input/50 bg-card py-2.5 pr-2.5 pl-3.5 shadow-xs transition-[border-color,box-shadow] hover:border-foreground/20 hover:shadow-md",
        sortable.isDragging && "opacity-30",
        timerRunning && "border-primary/40 bg-primary/5",
      )}
    >
      <span
        aria-hidden
        className={cn("absolute inset-y-0 left-0 w-0.5", PRIORITY_COLORS[ticket.priority])}
      />
      <span className="sr-only">{PRIORITY_LABELS[ticket.priority]} priority</span>

      <div>
        <button
          type="button"
          className="absolute top-2 left-0.5 cursor-grab text-muted-foreground/50 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 active:cursor-grabbing"
          aria-label="Drag"
          {...sortable.attributes}
          {...sortable.listeners}
        >
          <HugeiconsIcon
            icon={GripVerticalIcon}
            strokeWidth={2}
            className="size-3.5"
          />
        </button>

        <div className="min-w-0 pr-6">
          <p className="wrap-anywhere text-[13px] leading-snug font-medium">{ticket.title}</p>
          {ticket.description && (
            <p className="mt-1 line-clamp-2 text-xs wrap-anywhere text-muted-foreground">
              {ticket.description}
            </p>
          )}
          {(ticket.complexity || dateRange) && (
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
              {ticket.complexity && (
                <Badge
                  variant="secondary"
                  aria-label={`${COMPLEXITY_LABELS[ticket.complexity]} complexity`}
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
                          level <=
                            COMPLEXITY_LEVELS.indexOf(ticket.complexity as TicketComplexity) &&
                            "bg-foreground",
                        )}
                      />
                    ))}
                  </span>
                  {COMPLEXITY_LABELS[ticket.complexity]}
                </Badge>
              )}
              {dateRange && (
                <span
                  className={cn(
                    "flex items-center gap-1 text-[11px] tabular-nums text-muted-foreground",
                    overdue && "text-destructive",
                  )}
                  title={[
                    formatLocalDateTime(ticket.startDate),
                    formatLocalDateTime(ticket.dueDate),
                  ]
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
              )}
            </div>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="icon-sm"
              variant="ghost"
              className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100"
              aria-label="Ticket actions"
            >
              <HugeiconsIcon
                icon={MoreHorizontalIcon}
                strokeWidth={2}
                className="size-3.5"
              />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-40"
          >
            <DropdownMenuItem onClick={() => onEdit(ticket)}>
              <HugeiconsIcon
                icon={PencilEdit01Icon}
                strokeWidth={2}
                className="size-3"
              />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onComments(ticket)}>
              <HugeiconsIcon
                icon={Message01Icon}
                strokeWidth={2}
                className="size-3"
              />
              Comments
              {(ticket.commentCount ?? 0) > 0 && (
                <span className="ml-auto text-[10px] text-muted-foreground">
                  {ticket.commentCount}
                </span>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                copy(ticket.id);
                toast.success("Ticket ID copied.");
              }}
            >
              {copied ? (
                <HugeiconsIcon
                  icon={Tick02Icon}
                  strokeWidth={2}
                  className="size-3"
                />
              ) : (
                <HugeiconsIcon
                  icon={Copy01Icon}
                  strokeWidth={2}
                  className="size-3"
                />
              )}
              Copy ID
            </DropdownMenuItem>
            {timerActive && (
              <DropdownMenuItem
                onClick={() =>
                  onUpdate(
                    ticket.isPaused || !ticket.timerStartedAt
                      ? resumeTimer(ticket)
                      : pauseTimer(ticket),
                  )
                }
              >
                {timerPaused ? (
                  <>
                    <HugeiconsIcon
                      icon={PlayIcon}
                      strokeWidth={2}
                      className="size-3"
                    />
                    Resume
                  </>
                ) : (
                  <>
                    <HugeiconsIcon
                      icon={PauseIcon}
                      strokeWidth={2}
                      className="size-3"
                    />
                    Pause
                  </>
                )}
              </DropdownMenuItem>
            )}
            {(timerActive || ticket.totalElapsedMs > 0) && (
              <DropdownMenuItem onClick={() => onAdjust(ticket)}>
                <HugeiconsIcon
                  icon={Clock01Icon}
                  strokeWidth={2}
                  className="size-3"
                />
                Adjust time
              </DropdownMenuItem>
            )}
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Move to</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                {COLUMNS.map((c) => {
                  if (c === ticket.column) return null;

                  return (
                    <DropdownMenuItem
                      key={c}
                      onClick={() => onMoveToColumn(ticket.id, c)}
                    >
                      {COLUMN_LABELS[c]}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Priority</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                {(Object.keys(PRIORITY_LABELS) as Priority[]).map((p) => (
                  <DropdownMenuItem
                    key={p}
                    onClick={() => onUpdate({ ...ticket, priority: p })}
                  >
                    <span className={cn("size-2", PRIORITY_COLORS[p])} />
                    {PRIORITY_LABELS[p]}
                    {ticket.priority === p && " ✓"}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDelete(ticket)}
              className="text-destructive focus:text-destructive"
            >
              <HugeiconsIcon
                icon={Delete02Icon}
                strokeWidth={2}
                className="size-3"
              />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {hasFooter && (
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
      )}
    </div>
  );
}

/* eslint-disable react-hooks/refs -- @dnd-kit/sortable exposes refs/listeners that must be applied during render */
import { useEffect, useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Clock,
  Copy,
  Check,
  GripVertical,
  MessageSquare,
  MoreHorizontal,
  Pencil,
  Pause,
  Play,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

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
import { useCopy } from "@/lib/hooks/use-copy";

import {
  type ColumnId,
  type Priority,
  type Ticket,
  COLUMN_LABELS,
  COLUMNS,
  isTimerColumn,
  PRIORITY_COLORS,
  PRIORITY_LABELS,
} from "../types/board";
import { computeElapsed, formatDuration, pauseTimer, resumeTimer } from "../utils/timer";

interface TicketCardProps {
  ticket: Ticket;
  onEdit: (ticket: Ticket) => void;
  onComments: (ticket: Ticket) => void;
  onMoveToColumn: (id: string, column: ColumnId) => void;
  onUpdate: (ticket: Ticket) => void;
  onDelete: (ticket: Ticket) => void;
}

export function TicketCard({
  ticket,
  onEdit,
  onComments,
  onMoveToColumn,
  onUpdate,
  onDelete,
}: TicketCardProps) {
  const sortable = useSortable({
    id: ticket.id,
  });

  const { copied, copy } = useCopy();

  const style = {
    transform: CSS.Translate.toString(sortable.transform),
    transition: sortable.transition,
  };

  const [elapsed, setElapsed] = useState(() => computeElapsed(ticket));
  const [trackedTicket, setTrackedTicket] = useState(ticket);

  // Sync elapsed when the ticket identity/timer fields change (React-recommended render adjust)
  if (ticket !== trackedTicket) {
    setTrackedTicket(ticket);
    setElapsed(computeElapsed(ticket));
  }

  useEffect(() => {
    if (!ticket.timerStartedAt || ticket.isPaused) {
      return;
    }

    const id = setInterval(() => {
      setElapsed(computeElapsed(ticket));
    }, 1000);

    return () => clearInterval(id);
  }, [ticket]);

  const timerActive = isTimerColumn(ticket.column);
  const timerRunning = timerActive && ticket.timerStartedAt !== null && !ticket.isPaused;
  const timerPaused = timerActive && ticket.isPaused;

  return (
    <div
      ref={sortable.setNodeRef}
      style={style}
      className={cn(
        "group rounded-xl border border-input/50 bg-card p-2.5 shadow-sm transition-shadow",
        sortable.isDragging && "opacity-30",
        timerRunning && "border-primary/40 bg-primary/5",
      )}
    >
      <div className="flex items-start gap-1.5">
        <button
          type="button"
          className="mt-0.5 cursor-grab text-muted-foreground/40 opacity-0 group-hover:opacity-100 active:cursor-grabbing"
          aria-label="Drag"
          {...sortable.attributes}
          {...sortable.listeners}
        >
          <GripVertical className="size-3.5" />
        </button>

        <div className="min-w-0 flex-1">
          <p className="wrap-anywhere text-xs font-medium leading-snug">{ticket.title}</p>
          {ticket.description && (
            <p className="mt-1 line-clamp-2 text-[11px] wrap-anywhere text-muted-foreground">
              {ticket.description}
            </p>
          )}

          {(timerActive || ticket.totalElapsedMs > 0) && (
            <div className="mt-2 flex items-center gap-1.5">
              <Clock
                className={cn(
                  "size-3",
                  timerRunning && "text-primary animate-pulse",
                  timerPaused && "text-muted-foreground",
                  !timerActive && "text-muted-foreground",
                )}
              />
              <span
                className={cn(
                  "font-mono text-[11px]",
                  timerRunning && "text-primary",
                  !timerRunning && "text-muted-foreground",
                )}
              >
                {formatDuration(elapsed)}
              </span>
            </div>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="icon-sm"
              variant="ghost"
              className="shrink-0 opacity-0 group-hover:opacity-100"
              aria-label="Ticket actions"
            >
              <MoreHorizontal className="size-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-40"
          >
            <DropdownMenuItem onClick={() => onEdit(ticket)}>
              <Pencil className="size-3" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onComments(ticket)}>
              <MessageSquare className="size-3" />
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
              {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
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
                    <Play className="size-3" />
                    Resume
                  </>
                ) : (
                  <>
                    <Pause className="size-3" />
                    Pause
                  </>
                )}
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
                    <span className={cn("size-2 rounded-full", PRIORITY_COLORS[p])} />
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
              <Trash2 className="size-3" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="mt-2 flex items-center gap-1.5">
        <span
          className={cn("size-1.5 rounded-full", PRIORITY_COLORS[ticket.priority])}
          aria-label={`${PRIORITY_LABELS[ticket.priority]} priority`}
        />
        {(ticket.commentCount ?? 0) > 0 && (
          <span
            className="ml-auto flex items-center gap-1 text-[10px] text-muted-foreground"
            aria-label={`${ticket.commentCount} comment${ticket.commentCount === 1 ? "" : "s"}`}
          >
            <MessageSquare className="size-3" />
            {ticket.commentCount}
          </span>
        )}
      </div>
    </div>
  );
}

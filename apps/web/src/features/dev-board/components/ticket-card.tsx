import { useEffect, useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Clock,
  GripVertical,
  MoreHorizontal,
  Pencil,
  Pause,
  Play,
  Trash2,
} from "lucide-react";

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

import { useDeleteDevBoardTicket, useUpdateDevBoardTicket } from "../hooks/mutations";
import {
  type ColumnId,
  type Priority,
  type Ticket,
  COLUMN_LABELS,
  COLUMNS,
  PRIORITY_COLORS,
  PRIORITY_LABELS,
} from "../types";
import { computeElapsed, formatDuration, pauseTimer, resumeTimer } from "../utils/timer";

interface TicketCardProps {
  ticket: Ticket;
  onEdit: (ticket: Ticket) => void;
  onMoveToColumn: (id: string, column: ColumnId) => void;
}

export function TicketCard({
  ticket,
  onEdit,
  onMoveToColumn,
}: TicketCardProps) {
  const updateTicketMutation = useUpdateDevBoardTicket();
  const deleteTicketMutation = useDeleteDevBoardTicket();
  const sortable = useSortable({
    id: ticket.id,
  });

  const style = {
    transform: CSS.Translate.toString(sortable.transform),
    transition: sortable.transition,
  };

  const [elapsed, setElapsed] = useState(() => computeElapsed(ticket));

  useEffect(() => {
    setElapsed(computeElapsed(ticket));

    if (!ticket.timerStartedAt || ticket.isPaused) {
      return;
    }

    const id = setInterval(() => {
      setElapsed(computeElapsed(ticket));
    }, 1000);

    return () => clearInterval(id);
  }, [ticket]);

  const inProgress = ticket.column === "in_progress";
  const timerRunning = inProgress && ticket.timerStartedAt !== null && !ticket.isPaused;
  const timerPaused = inProgress && ticket.isPaused;

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
          <p className="text-xs font-medium leading-snug">{ticket.title}</p>
          {ticket.description && (
            <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground">
              {ticket.description}
            </p>
          )}

          {(inProgress || ticket.totalElapsedMs > 0) && (
            <div className="mt-2 flex items-center gap-1.5">
              <Clock
                className={cn(
                  "size-3",
                  timerRunning && "text-primary animate-pulse",
                  timerPaused && "text-muted-foreground",
                  !inProgress && "text-muted-foreground",
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
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={() => onEdit(ticket)}>
                <Pencil className="size-3" />
                Edit
              </DropdownMenuItem>
              {inProgress && (
                <DropdownMenuItem
                  onClick={() =>
                    updateTicketMutation.mutate(
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
                        onClick={() => updateTicketMutation.mutate({ ...ticket, priority: p })}
                    >
                      <span
                        className={cn("size-2 rounded-full", PRIORITY_COLORS[p])}
                      />
                      {PRIORITY_LABELS[p]}
                      {ticket.priority === p && " ✓"}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => deleteTicketMutation.mutate(ticket.id)}
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
      </div>
    </div>
  );
}

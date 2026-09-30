import { HugeiconsIcon } from "@hugeicons/react";
import {
  Clock01Icon,
  Copy01Icon,
  Delete02Icon,
  Message01Icon,
  MoreHorizontalIcon,
  PauseIcon,
  PencilEdit01Icon,
  PlayIcon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
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
import { pauseTimer, resumeTimer } from "../utils/timer";

interface TicketCardMenuProps {
  ticket: Ticket;
  onEdit: (ticket: Ticket) => void;
  onComments: (ticket: Ticket) => void;
  onAdjust: (ticket: Ticket) => void;
  onMoveToColumn: (id: string, column: ColumnId) => void;
  onUpdate: (ticket: Ticket) => void;
  onDelete: (ticket: Ticket) => void;
}

export function TicketCardMenu({
  ticket,
  onEdit,
  onComments,
  onAdjust,
  onMoveToColumn,
  onUpdate,
  onDelete,
}: TicketCardMenuProps) {
  const { copied, copy } = useCopy();
  const timerActive = isTimerColumn(ticket.column);
  const timerPaused = timerActive && ticket.isPaused;

  return (
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
            <span className="ml-auto text-[10px] text-muted-foreground">{ticket.commentCount}</span>
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
  );
}

import { HugeiconsIcon } from "@hugeicons/react";
import { Clock01Icon } from "@hugeicons/core-free-icons";

import { cn } from "@/lib/utils";

import type { Ticket } from "../types/board";
import { isTimerColumn, PRIORITY_COLORS } from "../types/board";
import { computeElapsed, formatDuration } from "../utils/timer";

interface TicketDragOverlayProps {
  ticket: Ticket;
}

export function TicketDragOverlay({ ticket }: TicketDragOverlayProps) {
  const timerRunning =
    isTimerColumn(ticket.column) && ticket.timerStartedAt !== null && !ticket.isPaused;

  return (
    <div
      className={cn(
        "relative border border-input/50 bg-card py-2.5 pr-2.5 pl-3.5 shadow-lg ring-1 ring-primary/20",
        timerRunning && "border-primary/40 bg-primary/5",
      )}
    >
      <span
        aria-hidden
        className={cn("absolute inset-y-0 left-0 w-0.5", PRIORITY_COLORS[ticket.priority])}
      />
      <p className="text-[13px] leading-snug font-medium">{ticket.title}</p>
      {ticket.description && (
        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{ticket.description}</p>
      )}
      {(isTimerColumn(ticket.column) || ticket.totalElapsedMs > 0) && (
        <div className="mt-2 flex items-center gap-1.5 text-muted-foreground">
          <HugeiconsIcon
            icon={Clock01Icon}
            strokeWidth={2}
            className="size-3"
          />
          <span className="font-mono text-[11px]">{formatDuration(computeElapsed(ticket))}</span>
        </div>
      )}
    </div>
  );
}

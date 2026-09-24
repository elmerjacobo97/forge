import { HugeiconsIcon } from "@hugeicons/react";
import { Clock01Icon } from "@hugeicons/core-free-icons";

import { cn } from "@/lib/utils";

import type { Ticket } from "../types/board";
import { isTimerColumn } from "../types/board";
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
        " border border-input/50 bg-card p-2.5 shadow-lg ring-1 ring-primary/20",
        timerRunning && "border-primary/40 bg-primary/5",
      )}
    >
      <p className="text-xs font-medium leading-snug">{ticket.title}</p>
      {ticket.description && (
        <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground">{ticket.description}</p>
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

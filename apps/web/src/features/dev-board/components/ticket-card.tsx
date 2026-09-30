/* eslint-disable react-hooks/refs -- @dnd-kit/sortable exposes refs/listeners that must be applied during render */
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { HugeiconsIcon } from "@hugeicons/react";
import { GripVerticalIcon } from "@hugeicons/core-free-icons";

import { cn } from "@/lib/utils";

import { type ColumnId, type Ticket, PRIORITY_COLORS, PRIORITY_LABELS } from "../types/board";
import { useTicketCardState } from "../hooks/use-ticket-card-state";
import { TicketCardMenu } from "./ticket-card-menu";
import { TicketCardFooter, TicketComplexityBadge, TicketDateRange } from "./ticket-card-parts";

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

  const style = {
    transform: CSS.Translate.toString(sortable.transform),
    transition: sortable.transition,
  };

  const { timerRunning, elapsed, dateRange, overdue, hasTimer, commentCount, hasFooter } =
    useTicketCardState(ticket);

  return (
    <div
      ref={sortable.setNodeRef}
      style={style}
      className={cn(
        "group relative border border-input/50 bg-card py-2.5 pr-2.5 pl-6 shadow-xs transition-[border-color,box-shadow] hover:border-foreground/20 hover:shadow-md",
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
          className="absolute top-2.5 left-1.5 cursor-grab p-0.5 text-muted-foreground/50 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 active:cursor-grabbing"
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
              {ticket.complexity && <TicketComplexityBadge complexity={ticket.complexity} />}
              {dateRange && (
                <TicketDateRange
                  ticket={ticket}
                  dateRange={dateRange}
                  overdue={overdue}
                />
              )}
            </div>
          )}
        </div>

        <TicketCardMenu
          ticket={ticket}
          onEdit={onEdit}
          onComments={onComments}
          onAdjust={onAdjust}
          onMoveToColumn={onMoveToColumn}
          onUpdate={onUpdate}
          onDelete={onDelete}
        />
      </div>

      {hasFooter && (
        <TicketCardFooter
          ticket={ticket}
          hasTimer={hasTimer}
          timerRunning={timerRunning}
          elapsed={elapsed}
          commentCount={commentCount}
        />
      )}
    </div>
  );
}

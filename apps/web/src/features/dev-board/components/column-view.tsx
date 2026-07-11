import { useMemo } from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Plus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

import {
  type ColumnId,
  type Priority,
  type Ticket,
  COLUMN_LABELS,
} from "../types";
import { computeElapsed } from "../utils/timer";
import { TicketCard } from "./ticket-card";

interface ColumnViewProps {
  columnId: ColumnId;
  tickets: Ticket[];
  isHighlighted: boolean;
  onEdit: (ticket: Ticket) => void;
  onDelete: (id: string) => void;
  onMoveToColumn: (id: string, column: ColumnId) => void;
  onTogglePause: (id: string) => void;
  onSetPriority: (id: string, priority: Priority) => void;
  onAddTicket: () => void;
  totalTickets: number;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  onLoadMore: () => void;
}

const COLUMN_ACCENT: Record<ColumnId, string> = {
  backlog: "border-t-slate-400",
  todo: "border-t-sky-400",
  in_progress: "border-t-primary",
  review: "border-t-violet-400",
  done: "border-t-emerald-400",
};

export function ColumnView({
  columnId,
  tickets,
  isHighlighted,
  onEdit,
  onDelete,
  onMoveToColumn,
  onTogglePause,
  onSetPriority,
  onAddTicket,
  totalTickets,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
}: ColumnViewProps) {
  const { setNodeRef } = useDroppable({ id: columnId });

  const colTickets = useMemo(
    () => tickets.filter((t) => t.column === columnId).sort((a, b) => b.position - a.position),
    [tickets, columnId],
  );

  const totalElapsed = colTickets.reduce((sum, t) => sum + computeElapsed(t), 0);
  const hours = totalElapsed / 3_600_000;
  const timeLabel = hours >= 1 ? `${hours.toFixed(1)}h` : `${Math.round(totalElapsed / 60_000)}m`;

  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col rounded-xl border border-t-2 border-input/40 bg-muted/20 transition-colors",
        COLUMN_ACCENT[columnId],
        isHighlighted && "border-primary/40 bg-primary/5 ring-1 ring-primary/30",
      )}
    >
      <div className="flex items-center justify-between gap-2 px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold">{COLUMN_LABELS[columnId]}</span>
          <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
            {totalTickets}
          </Badge>
        </div>
        {totalElapsed > 0 && (
          <span className="font-mono text-[10px] text-muted-foreground">{timeLabel}</span>
        )}
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div ref={setNodeRef} className="flex min-h-full flex-col gap-2 p-2">
          <SortableContext
            items={colTickets.map((t) => t.id)}
            strategy={verticalListSortingStrategy}
          >
            {colTickets.map((ticket) => (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                onEdit={onEdit}
                onDelete={onDelete}
                onMoveToColumn={onMoveToColumn}
                onTogglePause={onTogglePause}
                onSetPriority={onSetPriority}
              />
            ))}
          </SortableContext>

          {colTickets.length === 0 && (
            <div
              className={cn(
                "flex h-24 items-center justify-center rounded-lg border border-dashed text-[11px] transition-colors",
                isHighlighted
                  ? "border-primary/50 bg-primary/5 text-primary"
                  : "border-input/30 text-muted-foreground",
              )}
            >
              {isHighlighted ? "Drop here" : "Drop tickets here"}
            </div>
          )}

          {hasNextPage && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onLoadMore}
              disabled={isFetchingNextPage}
              className="h-7 w-full text-[11px] text-muted-foreground"
            >
              {isFetchingNextPage ? "Loading tickets..." : "Load more"}
            </Button>
          )}

          {columnId === "backlog" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onAddTicket}
              className="h-7 w-full justify-start gap-1.5 text-[11px] text-muted-foreground"
            >
              <Plus className="size-3" />
              Add ticket
            </Button>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

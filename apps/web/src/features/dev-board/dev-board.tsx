import { useEffect, useRef, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useUserQuery } from "@/features/auth/hooks/queries";

import { type ColumnId, type Ticket, COLUMNS } from "./types";
import { type TicketFormValues } from "./schema";
import {
  useCreateDevBoardTicket,
  useDeleteDevBoardTicket,
  useUpdateDevBoardTicket,
} from "./hooks/mutations";
import { devBoardKeys, useDevBoardRealtime, useDevBoardTickets } from "./hooks/queries";
import { ColumnView } from "./components/column-view";
import { BoardSkeleton } from "./components/board-skeleton";
import { TicketCard } from "./components/ticket-card";
import { TicketForm } from "./components/ticket-form";
import { checkStaleTickets, loadAlertedTickets, saveAlertedTickets } from "./utils/stale-alert";
import { createTicket, moveTicket } from "./utils/tickets";
import { pauseTimer, resumeTimer } from "./utils/timer";

function findTicket(tickets: Ticket[], id: string): Ticket | undefined {
  return tickets.find((t) => t.id === id);
}

function isColumnId(value: string): value is ColumnId {
  return (COLUMNS as readonly string[]).includes(value);
}

export function DevBoard() {
  const { data: user } = useUserQuery();
  const userId = user?.id;
  const queryClient = useQueryClient();
  const backlog = useDevBoardTickets(userId, "backlog");
  const todo = useDevBoardTickets(userId, "todo");
  const inProgress = useDevBoardTickets(userId, "in_progress");
  const review = useDevBoardTickets(userId, "review");
  const done = useDevBoardTickets(userId, "done");
  const columns = { backlog, todo, in_progress: inProgress, review, done };
  const tickets = COLUMNS.flatMap((column) =>
    columns[column].data?.pages.flatMap((page) => page.tickets) ?? [],
  ).sort((a, b) => b.position - a.position);
  const isLoading = COLUMNS.some((column) => columns[column].isLoading);
  const error = COLUMNS.map((column) => columns[column].error).find(Boolean);
  const createTicketMutation = useCreateDevBoardTicket();
  const updateTicketMutation = useUpdateDevBoardTicket();
  const deleteTicketMutation = useDeleteDevBoardTicket();

  useDevBoardRealtime(userId);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTicket, setEditTicket] = useState<Ticket | null>(null);
  const alertedRef = useRef<Set<string> | null>(null);
  if (!alertedRef.current) alertedRef.current = loadAlertedTickets();

  function refresh() {
    if (userId) void queryClient.invalidateQueries({ queryKey: devBoardKeys.user(userId) });
  }

  useEffect(() => {
    const check = () => {
      if (checkStaleTickets(tickets, alertedRef.current!)) {
        saveAlertedTickets(alertedRef.current!);
      }
    };

    check();
    const interval = window.setInterval(check, 60_000);
    return () => window.clearInterval(interval);
  }, [tickets]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor),
  );

  const activeTicket = activeId ? findTicket(tickets, activeId) : undefined;

  const overColumn: ColumnId | null = (() => {
    if (!overId) return null;
    if (isColumnId(overId)) return overId;
    const t = findTicket(tickets, overId);
    return t ? t.column : null;
  })();

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragOver(event: DragOverEvent) {
    setOverId(event.over ? (event.over.id as string) : null);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    setOverId(null);
    const { active, over } = event;
    if (!over) return;

    const activeIdStr = active.id as string;
    const overIdStr = over.id as string;
    const activeTicket = findTicket(tickets, activeIdStr);
    if (!activeTicket) return;

    if (isColumnId(overIdStr)) {
      // Dropped on empty column space → append to end
      if (activeTicket.column !== overIdStr) {
        moveAcrossColumn(activeIdStr, overIdStr, null);
      }
      return;
    }

    const overTicket = findTicket(tickets, overIdStr);
    if (!overTicket) return;

    if (activeTicket.column === overTicket.column) {
      // Same column → reorder
      reorderWithinColumn(activeIdStr, overIdStr);
    } else {
      // Cross-column → move to overTicket's column at overTicket's position
      moveAcrossColumn(activeIdStr, overTicket.column, overIdStr);
    }
  }

  function openNewTicket() {
    setEditTicket(null);
    setDialogOpen(true);
  }

  function openEditTicket(ticket: Ticket) {
    setEditTicket(ticket);
    setDialogOpen(true);
  }

  function handleSubmit(values: TicketFormValues) {
    if (editTicket) {
      updateTicketMutation.mutate({ ...editTicket, ...values });
    } else {
      createTicketMutation.mutate(createTicket(values));
    }
  }

  function handleDelete(id: string) {
    deleteTicketMutation.mutate(id);
    if (editTicket?.id === id) setDialogOpen(false);
  }

  function moveToColumn(id: string, target: ColumnId) {
    const ticket = findTicket(tickets, id);
    if (ticket) updateTicketMutation.mutate(moveTicket(ticket, target, tickets, null, true));
  }

  function reorderWithinColumn(activeId: string, overId: string) {
    const active = findTicket(tickets, activeId);
    const over = findTicket(tickets, overId);
    if (activeId !== overId && active && over && active.column === over.column) {
      updateTicketMutation.mutate(moveTicket(active, active.column, tickets, overId, false));
    }
  }

  function moveAcrossColumn(activeId: string, target: ColumnId, anchorOverId: string | null) {
    const ticket = findTicket(tickets, activeId);
    if (ticket) {
      updateTicketMutation.mutate(moveTicket(ticket, target, tickets, anchorOverId, anchorOverId === null));
    }
  }

  function togglePause(id: string) {
    const ticket = findTicket(tickets, id);
    if (!ticket || ticket.column !== "in_progress") return;
    updateTicketMutation.mutate(
      ticket.isPaused || !ticket.timerStartedAt ? resumeTimer(ticket) : pauseTimer(ticket),
    );
  }

  function setPriority(id: string, priority: Ticket["priority"]) {
    const ticket = findTicket(tickets, id);
    if (ticket) updateTicketMutation.mutate({ ...ticket, priority });
  }

  const ticketCount = Object.values(columns).reduce(
    (total, query) => total + (query.data?.pages[0]?.total ?? 0),
    0,
  );

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {ticketCount} ticket{ticketCount === 1 ? "" : "s"} · drag to move ·
          timer starts in "In Progress"
        </p>
        <Button size="sm" onClick={openNewTicket} className="gap-1.5">
          <Plus className="size-3.5" />
          New Ticket
        </Button>
      </div>

      {isLoading ? (
        <BoardSkeleton />
      ) : error ? (
        <Alert variant="destructive">
          <AlertTitle>Could not load tickets</AlertTitle>
          <AlertDescription className="flex items-center justify-between gap-3">
            <span>{error.message}</span>
            <Button size="sm" variant="outline" onClick={refresh}>
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      ) : (
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={() => {
          setActiveId(null);
          setOverId(null);
        }}
      >
        <div className="flex min-h-0 flex-1 gap-3 overflow-x-auto pb-1">
          {COLUMNS.map((columnId) => (
            <ColumnView
              key={columnId}
              columnId={columnId}
              tickets={tickets}
              isHighlighted={overColumn === columnId}
              onEdit={openEditTicket}
              onDelete={handleDelete}
              onMoveToColumn={moveToColumn}
              onTogglePause={togglePause}
              onSetPriority={setPriority}
              onAddTicket={openNewTicket}
              totalTickets={columns[columnId].data?.pages[0]?.total ?? 0}
              hasNextPage={columns[columnId].hasNextPage}
              isFetchingNextPage={columns[columnId].isFetchingNextPage}
              onLoadMore={() => void columns[columnId].fetchNextPage()}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTicket ? (
            <TicketCard
              ticket={activeTicket}
              isOverlay
              onEdit={() => {}}
              onDelete={() => {}}
              onMoveToColumn={() => {}}
              onTogglePause={() => {}}
              onSetPriority={() => {}}
            />
          ) : null}
        </DragOverlay>
      </DndContext>
      )}

      <TicketForm
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editTicket={editTicket}
        onSubmit={handleSubmit}
      />
    </div>
  );
}

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
import { Plus } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useUserQuery } from "@/features/auth/hooks/queries";

import { type ColumnId, type Ticket, COLUMNS } from "./types";
import { type TicketFormValues } from "./schema";
import {
  useCreateDevBoardTicket,
  useUpdateDevBoardTicket,
} from "./hooks/mutations";
import { useDevBoardRealtime, useDevBoardTickets } from "./hooks/queries";
import { ColumnView } from "./components/column-view";
import { BoardSkeleton } from "./components/board-skeleton";
import { TicketDragOverlay } from "./components/ticket-drag-overlay";
import { TicketForm } from "./components/ticket-form";
import { checkStaleTickets, loadAlertedTickets, saveAlertedTickets } from "./utils/stale-alert";
import { createTicket, moveTicket } from "./utils/tickets";

function findTicket(tickets: Ticket[], id: string): Ticket | undefined {
  return tickets.find((t) => t.id === id);
}

function isColumnId(value: string): value is ColumnId {
  return (COLUMNS as readonly string[]).includes(value);
}

export function DevBoard() {
  const { data: user } = useUserQuery();
  const backlog = useDevBoardTickets(user?.id, "backlog");
  const todo = useDevBoardTickets(user?.id, "todo");
  const inProgress = useDevBoardTickets(user?.id, "in_progress");
  const review = useDevBoardTickets(user?.id, "review");
  const done = useDevBoardTickets(user?.id, "done");
  const columns = { backlog, todo, in_progress: inProgress, review, done };
  const tickets = COLUMNS.flatMap(
    (column) => columns[column].data?.pages.flatMap((page) => page.tickets) ?? [],
  ).sort((a, b) => b.position - a.position);
  const isLoading = COLUMNS.some((column) => columns[column].isLoading);
  const error = COLUMNS.map((column) => columns[column].error).find(Boolean);
  const createTicketMutation = useCreateDevBoardTicket();
  const updateTicketMutation = useUpdateDevBoardTicket();

  useDevBoardRealtime(user?.id);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [dragTickets, setDragTickets] = useState<Ticket[] | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTicket, setEditTicket] = useState<Ticket | null>(null);
  const alertedRef = useRef<Set<string> | null>(null);
  const dragTicketsRef = useRef<Ticket[] | null>(null);
  const pendingDropRef = useRef<Ticket | null>(null);
  if (!alertedRef.current) alertedRef.current = loadAlertedTickets();

  function retryLoadingTickets() {
    void Promise.all(COLUMNS.map((column) => columns[column].refetch()));
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

  useEffect(() => {
    const pendingDrop = pendingDropRef.current;
    if (!pendingDrop) return;

    const persistedTicket = findTicket(tickets, pendingDrop.id);
    if (
      persistedTicket?.column === pendingDrop.column &&
      persistedTicket.position === pendingDrop.position
    ) {
      pendingDropRef.current = null;
      dragTicketsRef.current = null;
      setDragTickets(null);
    }
  }, [tickets]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor),
  );

  const visibleTickets = dragTickets ?? tickets;
  const activeTicket = activeId ? findTicket(visibleTickets, activeId) : undefined;

  const overColumn: ColumnId | null = (() => {
    if (!overId) return null;
    if (isColumnId(overId)) return overId;
    const t = findTicket(visibleTickets, overId);
    return t ? t.column : null;
  })();

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
    dragTicketsRef.current = tickets;
    setDragTickets(tickets);
  }

  function handleDragOver(event: DragOverEvent) {
    const overId = event.over ? (event.over.id as string) : null;
    setOverId(overId);
    if (!overId) return;

    const currentTickets = dragTicketsRef.current ?? tickets;
    const activeTicket = findTicket(currentTickets, event.active.id as string);
    const targetColumn = isColumnId(overId) ? overId : findTicket(currentTickets, overId)?.column;
    if (!activeTicket || !targetColumn || activeTicket.column === targetColumn) return;

    const nextTickets = currentTickets.map((ticket) =>
      ticket.id === activeTicket.id
        ? moveTicket(
            activeTicket,
            targetColumn,
            currentTickets,
            isColumnId(overId) ? null : overId,
            isColumnId(overId),
          )
        : ticket,
    );
    dragTicketsRef.current = nextTickets;
    setDragTickets(nextTickets);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    setOverId(null);
    const { active, over } = event;
    if (!over) {
      dragTicketsRef.current = null;
      setDragTickets(null);
      return;
    }

    const activeIdStr = active.id as string;
    const overIdStr = over.id as string;
    const currentTickets = dragTicketsRef.current ?? tickets;
    const activeTicket = findTicket(currentTickets, activeIdStr);
    const targetColumn = isColumnId(overIdStr)
      ? overIdStr
      : findTicket(currentTickets, overIdStr)?.column;
    if (!activeTicket || !targetColumn) return;

    const movedTicket =
      activeIdStr === overIdStr
        ? activeTicket
        : moveTicket(
            activeTicket,
            targetColumn,
            currentTickets,
            isColumnId(overIdStr) ? null : overIdStr,
            isColumnId(overIdStr),
          );
    const nextTickets = currentTickets.map((ticket) =>
      ticket.id === activeIdStr ? movedTicket : ticket,
    );
    dragTicketsRef.current = nextTickets;
    setDragTickets(nextTickets);
    pendingDropRef.current = movedTicket;
    updateTicketMutation.mutate(movedTicket, {
      onError: () => {
        pendingDropRef.current = null;
        dragTicketsRef.current = null;
        setDragTickets(null);
      },
    });
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

  function moveToColumn(id: string, target: ColumnId) {
    const ticket = findTicket(tickets, id);
    if (ticket) updateTicketMutation.mutate(moveTicket(ticket, target, tickets, null, true));
  }

  const ticketCount = Object.values(columns).reduce(
    (total, query) => total + (query.data?.pages[0]?.total ?? 0),
    0,
  );

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {ticketCount} ticket{ticketCount === 1 ? "" : "s"} · drag to move · timer starts in "In
          Progress"
        </p>
        <Button
          size="sm"
          onClick={openNewTicket}
          className="gap-1.5"
        >
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
            <Button
              size="sm"
              variant="outline"
              onClick={retryLoadingTickets}
            >
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
            dragTicketsRef.current = null;
            setDragTickets(null);
          }}
        >
          <div className="flex min-h-0 flex-1 gap-3 overflow-x-auto pb-1">
            {COLUMNS.map((columnId) => (
              <ColumnView
                key={columnId}
                columnId={columnId}
              tickets={visibleTickets}
              isHighlighted={overColumn === columnId}
              onEdit={openEditTicket}
              onMoveToColumn={moveToColumn}
              onAddTicket={openNewTicket}
                totalTickets={columns[columnId].data?.pages[0]?.total ?? 0}
                hasNextPage={columns[columnId].hasNextPage}
                isFetchingNextPage={columns[columnId].isFetchingNextPage}
                onLoadMore={() => void columns[columnId].fetchNextPage()}
              />
            ))}
          </div>

          <DragOverlay dropAnimation={null}>
            {activeTicket ? <TicketDragOverlay ticket={activeTicket} /> : null}
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

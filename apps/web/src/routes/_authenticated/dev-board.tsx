import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
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
import { BarChart3, Plus } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useUserQuery } from "@/features/auth/hooks/queries";

import { type ColumnId, type Ticket, COLUMNS } from "@/features/dev-board/types/board";
import { type TicketFormValues } from "@/features/dev-board/schemas/ticket";
import {
  useCreateDevBoardTicket,
  useUpdateDevBoardTicket,
} from "@/features/dev-board/hooks/mutations";
import { useDevBoardRealtime, useDevBoardTickets } from "@/features/dev-board/hooks/queries";
import { ColumnView } from "@/features/dev-board/components/column-view";
import { BoardSkeleton } from "@/features/dev-board/components/board-skeleton";
import { TicketDragOverlay } from "@/features/dev-board/components/ticket-drag-overlay";
import { TicketForm } from "@/features/dev-board/components/ticket-form";
import { checkStaleTickets, loadAlertedTickets, saveAlertedTickets } from "@/features/dev-board/utils/stale-alert";
import { createTicket, moveTicket } from "@/features/dev-board/utils/tickets";
import { createFileRoute } from "@tanstack/react-router";

function findTicket(tickets: Ticket[], id: string): Ticket | undefined {
  return tickets.find((t) => t.id === id);
}

function isColumnId(value: string): value is ColumnId {
  return (COLUMNS as readonly string[]).includes(value);
}

function DevBoardRoute() {
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
  const [alertedTickets] = useState(loadAlertedTickets);
  const dragTicketsRef = useRef<Ticket[] | null>(null);
  const pendingDropRef = useRef<Ticket | null>(null);

  function retryLoadingTickets() {
    void Promise.all(COLUMNS.map((column) => columns[column].refetch()));
  }

  useEffect(() => {
    const check = () => {
      if (checkStaleTickets(tickets, alertedTickets)) {
        saveAlertedTickets(alertedTickets);
      }
    };

    check();
    const interval = window.setInterval(check, 60_000);
    return () => window.clearInterval(interval);
  }, [alertedTickets, tickets]);

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
      createTicketMutation.mutate(createTicket(values, ""));
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
        <div className="flex items-center gap-2">
          <Button asChild size="sm" variant="outline"><Link to="/dev-board/analytics"><BarChart3 className="size-3.5" />Analytics</Link></Button>
          <Button size="sm" onClick={openNewTicket} className="gap-1.5"><Plus className="size-3.5" />New Ticket</Button>
        </div>
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

export const Route = createFileRoute("/_authenticated/dev-board")({
  component: DevBoardRoute,
});

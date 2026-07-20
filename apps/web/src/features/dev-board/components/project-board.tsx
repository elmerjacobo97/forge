"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
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
import { ArrowLeft, BarChart3, Plus } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useUserQuery } from "@/features/auth/hooks/queries";

import {
  useCreateDevBoardTicket,
  useUpdateDevBoardTicket,
} from "../hooks/mutations";
import {
  useDevBoardProject,
  useDevBoardRealtime,
  useDevBoardTickets,
} from "../hooks/queries";
import { type TicketFormValues } from "../schemas/ticket";
import { type ColumnId, type Ticket, COLUMNS } from "../types/board";
import { checkStaleTickets, loadAlertedTickets, saveAlertedTickets } from "../utils/stale-alert";
import { createTicket, moveTicket } from "../utils/tickets";
import { BoardSkeleton } from "./board-skeleton";
import { ColumnView } from "./column-view";
import { TicketDragOverlay } from "./ticket-drag-overlay";
import { TicketForm } from "./ticket-form";

function findTicket(tickets: Ticket[], id: string): Ticket | undefined {
  return tickets.find((t) => t.id === id);
}

function isColumnId(value: string): value is ColumnId {
  return (COLUMNS as readonly string[]).includes(value);
}

interface ProjectBoardProps {
  projectId: string;
}

export function ProjectBoard({ projectId }: ProjectBoardProps) {
  const { data: user } = useUserQuery();
  const projectQuery = useDevBoardProject(user?.id, projectId);
  const backlog = useDevBoardTickets(user?.id, projectId, "backlog");
  const todo = useDevBoardTickets(user?.id, projectId, "todo");
  const inProgress = useDevBoardTickets(user?.id, projectId, "in_progress");
  const review = useDevBoardTickets(user?.id, projectId, "review");
  const done = useDevBoardTickets(user?.id, projectId, "done");
  const columns = { backlog, todo, in_progress: inProgress, review, done };
  const tickets = COLUMNS.flatMap(
    (column) => columns[column].data?.pages.flatMap((page) => page.tickets) ?? [],
  ).sort((a, b) => b.position - a.position);
  const isLoading =
    projectQuery.isLoading || COLUMNS.some((column) => columns[column].isLoading);
  const error =
    projectQuery.error ?? COLUMNS.map((column) => columns[column].error).find(Boolean);
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

  function retryLoading() {
    void projectQuery.refetch();
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

  const pendingDrop = pendingDropRef.current;
  const dragSynced =
    !pendingDrop ||
    (() => {
      const persistedTicket = findTicket(tickets, pendingDrop.id);
      return (
        persistedTicket?.column === pendingDrop.column &&
        persistedTicket.position === pendingDrop.position
      );
    })();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor),
  );

  const visibleTickets =
    dragTickets !== null && !dragSynced ? dragTickets : tickets;
  const activeTicket = activeId ? findTicket(visibleTickets, activeId) : undefined;

  const overColumn: ColumnId | null = (() => {
    if (!overId) return null;
    if (isColumnId(overId)) return overId;
    const t = findTicket(visibleTickets, overId);
    return t ? t.column : null;
  })();

  function handleDragStart(event: DragStartEvent) {
    pendingDropRef.current = null;
    setActiveId(event.active.id as string);
    dragTicketsRef.current = tickets;
    setDragTickets(tickets);
  }

  function handleDragOver(event: DragOverEvent) {
    const nextOverId = event.over ? (event.over.id as string) : null;
    setOverId(nextOverId);
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
    const currentActiveTicket = findTicket(currentTickets, activeIdStr);
    const targetColumn = isColumnId(overIdStr)
      ? overIdStr
      : findTicket(currentTickets, overIdStr)?.column;
    if (!currentActiveTicket || !targetColumn) return;

    const movedTicket =
      activeIdStr === overIdStr
        ? currentActiveTicket
        : moveTicket(
            currentActiveTicket,
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
      createTicketMutation.mutate(createTicket(values, projectId));
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

  if (projectQuery.isError) {
    return (
      <div className="flex h-full flex-col gap-3">
        <Button asChild size="sm" variant="ghost" className="w-fit gap-1.5">
          <Link href="/dev-board">
            <ArrowLeft className="size-3.5" />
            Projects
          </Link>
        </Button>
        <Alert variant="destructive">
          <AlertTitle>Project not found</AlertTitle>
          <AlertDescription className="flex items-center justify-between gap-3">
            <span>{projectQuery.error.message}</span>
            <Button size="sm" variant="outline" onClick={retryLoading}>
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <Button asChild size="sm" variant="ghost" className="-ml-2 mb-1 h-7 gap-1.5 px-2">
            <Link href="/dev-board">
              <ArrowLeft className="size-3.5" />
              Projects
            </Link>
          </Button>
          <h1 className="truncate font-heading text-lg font-medium tracking-tight">
            {projectQuery.data?.name ?? "Project"}
          </h1>
          <p className="text-xs text-muted-foreground">
            {ticketCount} ticket{ticketCount === 1 ? "" : "s"} · drag to move · timer starts in "In
            Progress"
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button asChild size="sm" variant="outline">
            <Link href={`/dev-board/${projectId}/analytics`}>
              <BarChart3 className="size-3.5" />
              Analytics
            </Link>
          </Button>
          <Button size="sm" onClick={openNewTicket} className="gap-1.5">
            <Plus className="size-3.5" />
            New Ticket
          </Button>
        </div>
      </div>

      {isLoading ? (
        <BoardSkeleton />
      ) : error ? (
        <Alert variant="destructive">
          <AlertTitle>Could not load tickets</AlertTitle>
          <AlertDescription className="flex items-center justify-between gap-3">
            <span>{error.message}</span>
            <Button size="sm" variant="outline" onClick={retryLoading}>
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

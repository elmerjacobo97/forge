"use client";

import { useEffect, useRef, useState, useTransition } from "react";
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
import { ArrowLeft, BarChart3, Plus, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { createTicketAction, deleteTicketAction, updateTicketAction } from "../actions";
import type { TicketFormValues } from "../schemas/ticket";
import { type ColumnId, type ColumnPage, type Ticket, COLUMNS } from "../types/board";
import type { Project } from "../types/project";
import {
  appendTickets,
  columnTickets,
  incrementCommentCount,
  removeTicket,
  toColumnRecord,
  upsertTicket,
  type ColumnRecord,
} from "../utils/board-state";
import { checkStaleTickets, loadAlertedTickets, saveAlertedTickets } from "../utils/stale-alert";
import { moveTicket } from "../utils/tickets";
import { ColumnView } from "./column-view";
import { TicketCommentsDialog } from "./ticket-comments-dialog";
import { TicketDragOverlay } from "./ticket-drag-overlay";
import { TicketForm } from "./ticket-form";

function findTicket(tickets: Ticket[], id: string): Ticket | undefined {
  return tickets.find((ticket) => ticket.id === id);
}

function isColumnId(value: string): value is ColumnId {
  return (COLUMNS as readonly string[]).includes(value);
}

interface ProjectBoardProps {
  project: Project;
  initialColumns: ColumnPage[];
}

export function ProjectBoard({ project, initialColumns }: ProjectBoardProps) {
  const [columns, setColumns] = useState<ColumnRecord>(() => toColumnRecord(initialColumns));
  const [loadingColumns, setLoadingColumns] = useState<Partial<Record<ColumnId, boolean>>>({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [, startMutating] = useTransition();
  const tickets = columnTickets(columns);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [dragTickets, setDragTickets] = useState<Ticket[] | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTicket, setEditTicket] = useState<Ticket | null>(null);
  const [commentsTicket, setCommentsTicket] = useState<Ticket | null>(null);
  const [alertedTickets] = useState(loadAlertedTickets);
  const dragTicketsRef = useRef<Ticket[] | null>(null);

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

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor),
  );

  const visibleTickets = dragTickets ?? tickets;
  const activeTicket = activeId ? findTicket(visibleTickets, activeId) : undefined;

  const overColumn: ColumnId | null = (() => {
    if (!overId) return null;
    if (isColumnId(overId)) return overId;
    const ticket = findTicket(visibleTickets, overId);
    return ticket ? ticket.column : null;
  })();

  function persistTicket(ticket: Ticket, previous: ColumnRecord) {
    startMutating(async () => {
      const result = await updateTicketAction(ticket);
      if (!result.ok) {
        setColumns(previous);
        toast.error(result.message);
        return;
      }

      setColumns((current) => upsertTicket(current, result.data));
    });
  }

  function handleUpdate(ticket: Ticket) {
    const previous = columns;
    setColumns((current) => upsertTicket(current, ticket));
    persistTicket(ticket, previous);
  }

  function handleDelete(ticket: Ticket) {
    const previous = columns;
    setColumns((current) => removeTicket(current, ticket));

    startMutating(async () => {
      const result = await deleteTicketAction(ticket.id);
      if (!result.ok) {
        setColumns(previous);
        toast.error(result.message);
        return;
      }

      toast.success("Ticket deleted.");
    });
  }

  function handleCreate(values: TicketFormValues) {
    startMutating(async () => {
      const result = await createTicketAction({ projectId: project.id, ...values });
      if (!result.ok) {
        toast.error(result.message);
        return;
      }

      setColumns((current) => upsertTicket(current, result.data));
      toast.success("Ticket created.");
    });
  }

  function handleSubmit(values: TicketFormValues) {
    if (editTicket) {
      handleUpdate({ ...editTicket, ...values });
      return;
    }

    handleCreate(values);
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
    dragTicketsRef.current = tickets;
    setDragTickets(tickets);
  }

  function handleDragOver(event: DragOverEvent) {
    setOverId(event.over ? (event.over.id as string) : null);
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

    dragTicketsRef.current = null;
    setDragTickets(null);

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

    const previous = columns;
    setColumns((current) => upsertTicket(current, movedTicket));
    persistTicket(movedTicket, previous);
  }

  function openNewTicket() {
    setEditTicket(null);
    setDialogOpen(true);
  }

  function openEditTicket(ticket: Ticket) {
    setEditTicket(ticket);
    setDialogOpen(true);
  }

  function openComments(ticket: Ticket) {
    setCommentsTicket(ticket);
  }

  function handleCommentCreated(ticketId: string) {
    setColumns((current) => incrementCommentCount(current, ticketId));
    setCommentsTicket((current) =>
      current && current.id === ticketId
        ? { ...current, commentCount: (current.commentCount ?? 0) + 1 }
        : current,
    );
  }

  function moveToColumn(id: string, target: ColumnId) {
    const ticket = findTicket(tickets, id);
    if (ticket) handleUpdate(moveTicket(ticket, target, tickets, null, true));
  }

  async function loadMore(column: ColumnId) {
    const cursor = columns[column].nextCursor;
    if (!cursor) return;

    setLoadingColumns((current) => ({ ...current, [column]: true }));

    try {
      const response = await fetch(
        `/api/dev-board/projects/${project.id}/tickets?column=${column}&cursor=${cursor}`,
      );
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "Failed to load more tickets.");
      }

      const body = (await response.json()) as {
        tickets: Ticket[];
        nextCursor: string | null;
        total: number;
      };
      setColumns((current) =>
        appendTickets(current, column, body.tickets, body.nextCursor, body.total),
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load more tickets.");
    } finally {
      setLoadingColumns((current) => ({ ...current, [column]: false }));
    }
  }

  async function refreshBoard() {
    if (isRefreshing) return;

    setIsRefreshing(true);
    try {
      const response = await fetch(`/api/dev-board/projects/${project.id}/board`);
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "Failed to refresh board.");
      }

      const body = (await response.json()) as { columns: ColumnPage[] };
      setColumns(toColumnRecord(body.columns));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to refresh board.");
    } finally {
      setIsRefreshing(false);
    }
  }

  const ticketCount = COLUMNS.reduce((total, column) => total + columns[column].total, 0);

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <Button
            asChild
            size="sm"
            variant="ghost"
            className="-ml-2 mb-1 h-7 gap-1.5 px-2"
          >
            <Link href="/dev-board">
              <ArrowLeft className="size-3.5" />
              Projects
            </Link>
          </Button>
          <h1 className="truncate font-heading text-lg font-medium tracking-tight">
            {project.name}
          </h1>
          <p className="text-xs text-muted-foreground">
            {ticketCount} ticket{ticketCount === 1 ? "" : "s"} · drag to move · timer starts in
            &quot;In Progress&quot;
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            type="button"
            size="icon-sm"
            variant="outline"
            onClick={() => void refreshBoard()}
            disabled={isRefreshing}
            aria-label="Refresh board"
            title="Refresh board"
          >
            <RefreshCw className={cn("size-3.5", isRefreshing && "animate-spin")} />
          </Button>
          <Button
            asChild
            size="sm"
            variant="outline"
          >
            <Link href={`/dev-board/${project.id}/analytics`}>
              <BarChart3 className="size-3.5" />
              Analytics
            </Link>
          </Button>
          <Button
            size="sm"
            onClick={openNewTicket}
            className="gap-1.5"
          >
            <Plus className="size-3.5" />
            New Ticket
          </Button>
        </div>
      </div>

      <DndContext
        id="project-board-dnd"
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
              onComments={openComments}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
              onMoveToColumn={moveToColumn}
              onAddTicket={openNewTicket}
              totalTickets={columns[columnId].total}
              hasNextPage={columns[columnId].nextCursor !== null}
              isFetchingNextPage={Boolean(loadingColumns[columnId])}
              onLoadMore={() => void loadMore(columnId)}
            />
          ))}
        </div>

        <DragOverlay dropAnimation={null}>
          {activeTicket ? <TicketDragOverlay ticket={activeTicket} /> : null}
        </DragOverlay>
      </DndContext>

      <TicketForm
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editTicket={editTicket}
        onSubmit={handleSubmit}
      />

      <TicketCommentsDialog
        ticket={commentsTicket}
        open={commentsTicket !== null}
        onOpenChange={(open) => {
          if (!open) setCommentsTicket(null);
        }}
        onCommentCreated={handleCommentCreated}
      />
    </div>
  );
}

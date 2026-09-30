"use client";

import { useCallback, useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";

import { useBoardRealtime } from "../hooks/use-board-realtime";
import { useBoardDrag } from "../hooks/use-board-drag";
import { useBoardMutations, type MovePrompt } from "../hooks/use-board-mutations";
import { useBoardRemote } from "../hooks/use-board-remote";
import { useStaleTicketAlerts } from "../hooks/use-stale-ticket-alerts";
import type { TicketFormValues } from "../schemas/ticket";
import { type ColumnPage, type Ticket, COLUMNS } from "../types/board";
import type { Project } from "../types/project";
import {
  applyRealtimeTicket,
  columnTickets,
  incrementCommentCount,
  toColumnRecord,
  type ColumnRecord,
} from "../utils/board-state";
import type { CommentChange, TicketChange } from "../utils/board-realtime";
import { ColumnView } from "./column-view";
import { ProjectBoardHeader } from "./project-board-header";
import { StaleMovePrompt } from "./stale-move-prompt";
import { TicketCommentsDialog } from "./ticket-comments-dialog";
import { TicketDragOverlay } from "./ticket-drag-overlay";
import { TicketForm } from "./ticket-form";
import { TicketTimeDialog } from "./ticket-time-dialog";

interface ProjectBoardProps {
  project: Project;
  userId: string;
  initialColumns: ColumnPage[];
  initialTicket: Ticket | null;
}

export function ProjectBoard({
  project,
  userId,
  initialColumns,
  initialTicket,
}: ProjectBoardProps) {
  const [columns, setColumns] = useState<ColumnRecord>(() => toColumnRecord(initialColumns));
  const { loadingColumns, isRefreshing, loadMore, refreshBoard } = useBoardRemote(
    project.id,
    columns,
    setColumns,
  );
  const tickets = useMemo(() => columnTickets(columns), [columns]);
  useStaleTicketAlerts(tickets);

  const [dialogOpen, setDialogOpen] = useState(initialTicket !== null);
  const [editTicket, setEditTicket] = useState<Ticket | null>(initialTicket);
  const [commentsTicket, setCommentsTicket] = useState<Ticket | null>(null);
  const [timeTicket, setTimeTicket] = useState<Ticket | null>(null);
  const [movePrompt, setMovePrompt] = useState<MovePrompt | null>(null);

  const { handleUpdate, handleDelete, handleCreate, handleAdjusted, commitMove, moveToColumn } =
    useBoardMutations({ projectId: project.id, columns, setColumns, onStaleMove: setMovePrompt });
  const {
    visibleTickets,
    activeTicket,
    overColumn,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDragCancel,
  } = useBoardDrag({ tickets, commitMove });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor),
  );

  const handleRealtimeTicket = useCallback((change: TicketChange) => {
    setColumns((current) => applyRealtimeTicket(current, change));
  }, []);

  const handleRealtimeComment = useCallback((change: CommentChange) => {
    setColumns((current) => incrementCommentCount(current, change.ticketId));
  }, []);

  useBoardRealtime(userId, {
    onTicketChange: handleRealtimeTicket,
    onCommentChange: handleRealtimeComment,
  });

  function handleSubmit(values: TicketFormValues) {
    if (editTicket) {
      handleUpdate({ ...editTicket, ...values });
      return;
    }

    handleCreate(values);
  }

  function openNewTicket() {
    setEditTicket(null);
    setDialogOpen(true);
  }

  function openEditTicket(ticket: Ticket) {
    setEditTicket(ticket);
    setDialogOpen(true);
  }

  function handleCommentCreated(ticketId: string) {
    setCommentsTicket((current) =>
      current && current.id === ticketId
        ? { ...current, commentCount: (current.commentCount ?? 0) + 1 }
        : current,
    );
  }

  const ticketCount = COLUMNS.reduce((total, column) => total + columns[column].total, 0);

  return (
    <div className="flex h-full flex-col gap-3">
      <ProjectBoardHeader
        project={project}
        ticketCount={ticketCount}
        isRefreshing={isRefreshing}
        onRefresh={() => void refreshBoard()}
        onNewTicket={openNewTicket}
      />

      <DndContext
        id="project-board-dnd"
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="flex min-h-0 flex-1 gap-3 overflow-x-auto pb-1">
          {COLUMNS.map((columnId) => (
            <ColumnView
              key={columnId}
              columnId={columnId}
              tickets={visibleTickets}
              isHighlighted={overColumn === columnId}
              onEdit={openEditTicket}
              onComments={setCommentsTicket}
              onAdjust={setTimeTicket}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
              onMoveToColumn={(id, target) => moveToColumn(tickets, id, target)}
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

      <TicketTimeDialog
        ticket={timeTicket}
        open={timeTicket !== null}
        onOpenChange={(open) => {
          if (!open) setTimeTicket(null);
        }}
        onAdjusted={handleAdjusted}
      />

      <StaleMovePrompt
        ticket={movePrompt?.ticket ?? null}
        sessionMs={movePrompt?.sessionMs ?? 0}
        open={movePrompt !== null}
        onOpenChange={(open) => {
          if (!open) setMovePrompt(null);
        }}
        onAdjust={(ticket) => {
          setMovePrompt(null);
          setTimeTicket(ticket);
        }}
      />
    </div>
  );
}

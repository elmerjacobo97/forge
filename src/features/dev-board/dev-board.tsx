import { useState } from "react";
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

import { Button } from "@/components/ui/button";

import { type ColumnId, type Ticket, COLUMNS } from "./types";
import { type TicketFormValues } from "./schema";
import { useBoard } from "./hooks/use-board";
import { ColumnView } from "./components/column-view";
import { TicketCard } from "./components/ticket-card";
import { TicketForm } from "./components/ticket-form";

function findTicket(tickets: Ticket[], id: string): Ticket | undefined {
  return tickets.find((t) => t.id === id);
}

function isColumnId(value: string): value is ColumnId {
  return (COLUMNS as readonly string[]).includes(value);
}

export function DevBoard() {
  const {
    tickets,
    addTicket,
    updateTicket,
    deleteTicket,
    moveToColumn,
    reorderWithinColumn,
    moveAcrossColumn,
    togglePause,
    setPriority,
  } = useBoard();

  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTicket, setEditTicket] = useState<Ticket | null>(null);

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
      updateTicket(editTicket.id, values);
    } else {
      addTicket(values);
    }
  }

  function handleDelete(id: string) {
    deleteTicket(id);
    if (editTicket?.id === id) setDialogOpen(false);
  }

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {tickets.length} ticket{tickets.length === 1 ? "" : "s"} · drag to move ·
          timer starts in "In Progress"
        </p>
        <Button size="sm" onClick={openNewTicket} className="gap-1.5">
          <Plus className="size-3.5" />
          New Ticket
        </Button>
      </div>

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

      <TicketForm
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editTicket={editTicket}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
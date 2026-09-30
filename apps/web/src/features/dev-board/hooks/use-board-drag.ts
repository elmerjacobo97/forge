import { useRef, useState } from "react";
import type { DragEndEvent, DragOverEvent, DragStartEvent } from "@dnd-kit/core";

import { COLUMNS, type ColumnId, type Ticket } from "../types/board";
import { staleSessionMsForMove } from "../utils/stale-session";
import { moveTicket } from "../utils/tickets";

export function findTicket(tickets: Ticket[], id: string): Ticket | undefined {
  return tickets.find((ticket) => ticket.id === id);
}

export function isColumnId(value: string): value is ColumnId {
  return (COLUMNS as readonly string[]).includes(value);
}

interface UseBoardDragOptions {
  tickets: Ticket[];
  commitMove: (movedTicket: Ticket, staleSessionMs: number | null) => void;
}

export function useBoardDrag({ tickets, commitMove }: UseBoardDragOptions) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [dragTickets, setDragTickets] = useState<Ticket[] | null>(null);
  const dragTicketsRef = useRef<Ticket[] | null>(null);

  function resetDrag() {
    setActiveId(null);
    setOverId(null);
    dragTicketsRef.current = null;
    setDragTickets(null);
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
    const { active, over } = event;
    const currentTickets = dragTicketsRef.current ?? tickets;
    resetDrag();
    if (!over) return;

    const activeIdStr = active.id as string;
    const overIdStr = over.id as string;
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

    commitMove(movedTicket, staleSessionMsForMove(currentActiveTicket, targetColumn));
  }

  const visibleTickets = dragTickets ?? tickets;
  const activeTicket = activeId ? findTicket(visibleTickets, activeId) : undefined;
  const overColumn: ColumnId | null = (() => {
    if (!overId) return null;
    if (isColumnId(overId)) return overId;
    return findTicket(visibleTickets, overId)?.column ?? null;
  })();

  return {
    visibleTickets,
    activeTicket,
    overColumn,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDragCancel: resetDrag,
  };
}

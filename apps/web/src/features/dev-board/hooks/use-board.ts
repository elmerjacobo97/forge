import { useCallback, useEffect, useRef, useState } from "react";

import type { ColumnId, MoveEvent, Priority, Ticket } from "../types";
import type { TicketFormValues } from "../schema";
import { saveBoard, loadBoard } from "../utils/storage";
import {
  pauseTimer,
  resumeTimer,
  startTimer,
  stopTimer,
  nowISO,
} from "../utils/timer";

function sortByOrder(a: Ticket, b: Ticket): number {
  return a.order - b.order;
}

function reindexColumn(tickets: Ticket[], column: ColumnId): void {
  tickets
    .filter((t) => t.column === column)
    .sort(sortByOrder)
    .forEach((t, i) => {
      t.order = i;
    });
}

function appendMoveEvent(ticket: Ticket, from: ColumnId, to: ColumnId): MoveEvent[] {
  return [...ticket.history, { at: nowISO(), from, to }];
}

export function useBoard() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loaded, setLoaded] = useState(false);
  const savedRef = useRef<Ticket[]>([]);

  useEffect(() => {
    const initial = loadBoard();
    setTickets(initial);
    savedRef.current = initial;
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    if (tickets === savedRef.current) return;
    saveBoard(tickets);
    savedRef.current = tickets;
  }, [tickets, loaded]);

  const addTicket = useCallback((values: TicketFormValues) => {
    setTickets((prev) => {
      const id = `tk-${crypto.randomUUID()}`;
      const backlogCount = prev.filter((t) => t.column === "backlog").length;
      const ticket: Ticket = {
        id,
        title: values.title,
        description: values.description,
        column: "backlog",
        order: backlogCount,
        priority: values.priority,
        createdAt: nowISO(),
        timerStartedAt: null,
        totalElapsedMs: 0,
        isPaused: false,
        history: [],
      };
      return [...prev, ticket];
    });
  }, []);

  const updateTicket = useCallback((id: string, values: TicketFormValues) => {
    setTickets((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, title: values.title, description: values.description, priority: values.priority }
          : t,
      ),
    );
  }, []);

  const deleteTicket = useCallback((id: string) => {
    setTickets((prev) => {
      const next = prev.filter((t) => t.id !== id);
      const cols: ColumnId[] = ["backlog", "todo", "in_progress", "review", "done"];
      cols.forEach((c) => reindexColumn(next, c));
      return next;
    });
  }, []);

  const moveToColumn = useCallback((id: string, target: ColumnId) => {
    setTickets((prev) => {
      const targetTicket = prev.find((t) => t.id === id);
      if (!targetTicket || targetTicket.column === target) return prev;

      const from = targetTicket.column;
      let updated = targetTicket;
      if (target === "in_progress") {
        updated = startTimer(updated);
      } else if (from === "in_progress") {
        updated = stopTimer(updated);
      }
      const countInTarget = prev.filter((t) => t.column === target).length;
      updated = {
        ...updated,
        column: target,
        order: countInTarget,
        history: appendMoveEvent(updated, from, target),
      };

      const next = prev.map((t) => (t.id === id ? updated : t));
      reindexColumn(next, from);
      return next;
    });
  }, []);

  const reorderWithinColumn = useCallback(
    (activeId: string, overId: string) => {
      setTickets((prev) => {
        const active = prev.find((t) => t.id === activeId);
        const over = prev.find((t) => t.id === overId);
        if (!active || !over || active.column !== over.column) return prev;

        const col = active.column;
        const colTickets = prev
          .filter((t) => t.column === col)
          .sort(sortByOrder);
        const fromIdx = colTickets.findIndex((t) => t.id === activeId);
        const toIdx = colTickets.findIndex((t) => t.id === overId);
        if (fromIdx === -1 || toIdx === -1 || fromIdx === toIdx) return prev;

        const moved = colTickets.splice(fromIdx, 1)[0];
        colTickets.splice(toIdx, 0, moved);
        const orderMap = new Map<string, number>();
        colTickets.forEach((t, i) => orderMap.set(t.id, i));

        return prev.map((t) =>
          t.column === col ? { ...t, order: orderMap.get(t.id) ?? t.order } : t,
        );
      });
    },
    [],
  );

  const moveAcrossColumn = useCallback(
    (activeId: string, target: ColumnId, anchorOverId: string | null) => {
      setTickets((prev) => {
        const active = prev.find((t) => t.id === activeId);
        if (!active || active.column === target) return prev;
        const from = active.column;
        let updated = active;
        if (target === "in_progress") {
          updated = startTimer(updated);
        } else if (from === "in_progress") {
          updated = stopTimer(updated);
        }

        const colTickets = prev
          .filter((t) => t.column === target)
          .sort(sortByOrder);
        let insertOrder = colTickets.length;
        if (anchorOverId) {
          const anchorIdx = colTickets.findIndex((t) => t.id === anchorOverId);
          if (anchorIdx !== -1) insertOrder = colTickets[anchorIdx].order;
        }
        const shifted = colTickets.map((t) =>
          t.order >= insertOrder ? { ...t, order: t.order + 1 } : t,
        );
        updated = {
          ...updated,
          column: target,
          order: insertOrder,
          history: appendMoveEvent(updated, from, target),
        };

        const next = prev
          .map((t) => (t.id === activeId ? updated : t))
          .map((t) => {
            if (t.column === target && t.id !== activeId) {
              const shift = shifted.find((s) => s.id === t.id);
              return shift ?? t;
            }
            return t;
          });
        reindexColumn(next, from);
        reindexColumn(next, target);
        return next;
      });
    },
    [],
  );

  const togglePause = useCallback((id: string) => {
    setTickets((prev) =>
      prev.map((t) => {
        if (t.id !== id || t.column !== "in_progress") return t;
        if (t.isPaused || !t.timerStartedAt) return resumeTimer(t);
        return pauseTimer(t);
      }),
    );
  }, []);

  const setPriority = useCallback((id: string, priority: Priority) => {
    setTickets((prev) =>
      prev.map((t) => (t.id === id ? { ...t, priority } : t)),
    );
  }, []);

  return {
    tickets,
    loaded,
    addTicket,
    updateTicket,
    deleteTicket,
    moveToColumn,
    reorderWithinColumn,
    moveAcrossColumn,
    togglePause,
    setPriority,
  };
}
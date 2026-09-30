import { useTransition, type Dispatch, type SetStateAction } from "react";
import { toast } from "sonner";

import { createTicketAction, deleteTicketAction, updateTicketAction } from "../actions";
import type { TicketFormValues } from "../schemas/ticket";
import type { ColumnId, Ticket } from "../types/board";
import {
  removeTicket,
  restoreTicket,
  upsertTicket,
  type ColumnRecord,
} from "../utils/board-state";
import { staleSessionMsForMove } from "../utils/stale-session";
import { moveTicket } from "../utils/tickets";

export type MovePrompt = { ticket: Ticket; sessionMs: number };

interface UseBoardMutationsOptions {
  projectId: string;
  columns: ColumnRecord;
  setColumns: Dispatch<SetStateAction<ColumnRecord>>;
  onStaleMove: (prompt: MovePrompt) => void;
}

export function useBoardMutations({
  projectId,
  columns,
  setColumns,
  onStaleMove,
}: UseBoardMutationsOptions) {
  const [, startMutating] = useTransition();

  function persistTicket(
    ticket: Ticket,
    previous: ColumnRecord,
    onSaved?: (saved: Ticket) => void,
  ) {
    startMutating(async () => {
      const result = await updateTicketAction(ticket);
      if (!result.ok) {
        setColumns((current) => restoreTicket(current, previous, ticket.id));
        toast.error(result.message);
        return;
      }

      setColumns((current) => upsertTicket(current, result.data));
      onSaved?.(result.data);
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
        setColumns((current) => restoreTicket(current, previous, ticket.id));
        toast.error(result.message);
        return;
      }

      toast.success("Ticket deleted.");
    });
  }

  function handleCreate(values: TicketFormValues) {
    startMutating(async () => {
      const result = await createTicketAction({ projectId, ...values });
      if (!result.ok) {
        toast.error(result.message);
        return;
      }

      setColumns((current) => upsertTicket(current, result.data));
      toast.success("Ticket created.");
    });
  }

  function handleAdjusted(ticket: Ticket) {
    setColumns((current) => upsertTicket(current, ticket));
  }

  function commitMove(movedTicket: Ticket, staleSessionMs: number | null) {
    const previous = columns;
    setColumns((current) => upsertTicket(current, movedTicket));
    persistTicket(movedTicket, previous, (saved) => {
      if (staleSessionMs !== null) onStaleMove({ ticket: saved, sessionMs: staleSessionMs });
    });
  }

  function moveToColumn(tickets: Ticket[], id: string, target: ColumnId) {
    const ticket = tickets.find((item) => item.id === id);
    if (!ticket) return;

    commitMove(
      moveTicket(ticket, target, tickets, null, true),
      staleSessionMsForMove(ticket, target),
    );
  }

  return {
    handleUpdate,
    handleDelete,
    handleCreate,
    handleAdjusted,
    commitMove,
    moveToColumn,
  };
}

import { z } from "zod";

import { COLUMNS, type ColumnId, type Ticket } from "../types/board";
import { ticketRowSchema, toTicket } from "./ticket-row";

export const TICKET_EVENT = "dev-board:ticket";
export const COMMENT_EVENT = "dev-board:comment";

export type TicketChangeAction = "insert" | "update" | "delete";

export interface TicketChange {
  action: TicketChangeAction;
  fromColumn: ColumnId | null;
  ticket: Ticket;
}

export interface CommentChange {
  ticketId: string;
}

const ticketChangeSchema = z.object({
  action: z.enum(["insert", "update", "delete"]),
  from_column: z.enum(COLUMNS).nullable().optional(),
  ticket: ticketRowSchema,
});

const commentChangeSchema = z.object({
  action: z.literal("insert"),
  comment: z.object({ ticket_id: z.string() }),
});

export function parseTicketChange(payload: unknown): TicketChange | null {
  const parsed = ticketChangeSchema.safeParse(payload);
  if (!parsed.success) return null;

  return {
    action: parsed.data.action,
    fromColumn: parsed.data.from_column ?? null,
    ticket: toTicket(parsed.data.ticket),
  };
}

export function parseCommentChange(payload: unknown): CommentChange | null {
  const parsed = commentChangeSchema.safeParse(payload);
  if (!parsed.success) return null;

  return { ticketId: parsed.data.comment.ticket_id };
}

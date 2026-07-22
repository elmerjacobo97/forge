import { z } from "zod";

import { insforge } from "@/lib/insforge/browser";
import { type ColumnId, type Ticket, TICKETS_PAGE_SIZE } from "../types/board";

const ticketRowSchema = z.object({
  id: z.string(),
  project_id: z.string(),
  title: z.string(),
  description: z.string(),
  column_id: z.enum(["backlog", "todo", "in_progress", "review", "done"]),
  position: z.coerce.number(),
  priority: z.enum(["low", "med", "high"]),
  created_at: z.string(),
  timer_started_at: z.string().nullable(),
  total_elapsed_ms: z.coerce.number(),
  is_paused: z.boolean(),
  last_moved_at: z.string(),
});

export interface TicketPage {
  tickets: Ticket[];
  nextCursor: string | null;
  total: number;
}

function toTicket(value: unknown): Ticket {
  const row = ticketRowSchema.parse(value);
  return {
    id: row.id,
    projectId: row.project_id,
    title: row.title,
    description: row.description,
    column: row.column_id,
    position: row.position,
    priority: row.priority,
    createdAt: row.created_at,
    timerStartedAt: row.timer_started_at,
    totalElapsedMs: row.total_elapsed_ms,
    isPaused: row.is_paused,
    lastMovedAt: row.last_moved_at,
  };
}

function rpcTicket(value: unknown): Ticket {
  if (Array.isArray(value)) return toTicket(value[0]);
  return toTicket(value);
}

function failure(error: { message?: string } | null, fallback: string): Error {
  return new Error(error?.message || fallback);
}

async function getTicket(ticketId: string): Promise<Ticket> {
  const { data, error } = await insforge.database
    .from("dev_board_tickets")
    .select("id,project_id,title,description,column_id,position,priority,created_at,timer_started_at,total_elapsed_ms,is_paused,last_moved_at")
    .eq("id", ticketId)
    .single();
  if (error) throw failure(error, "Ticket not found.");
  return toTicket(data);
}

export const devBoardService = {
  async fetchTicketPage(
    _userId: string,
    projectId: string,
    column: ColumnId,
    cursor: string | null,
  ): Promise<TicketPage> {
    const offset = cursor ? Number(cursor) : 0;
    const { data, error, count } = await insforge.database
      .from("dev_board_tickets")
      .select(
        "id,project_id,title,description,column_id,position,priority,created_at,timer_started_at,total_elapsed_ms,is_paused,last_moved_at",
        { count: "exact" },
      )
      .eq("project_id", projectId)
      .eq("column_id", column)
      .order("position", { ascending: false })
      .range(offset, offset + TICKETS_PAGE_SIZE - 1);
    if (error) throw failure(error, "Failed to load tickets.");
    const tickets = ticketRowSchema.array().parse(data).map(toTicket);
    const nextOffset = offset + tickets.length;
    return {
      tickets,
      nextCursor: tickets.length === TICKETS_PAGE_SIZE ? String(nextOffset) : null,
      total: count ?? tickets.length,
    };
  },

  async createTicket(ticket: Ticket, _userId: string): Promise<Ticket> {
    const { data, error } = await insforge.database.rpc("create_dev_board_ticket", {
      p_project_id: ticket.projectId,
      p_title: ticket.title,
      p_description: ticket.description,
      p_column_id: ticket.column,
      p_priority: ticket.priority,
    });
    if (error) throw failure(error, "Failed to create ticket.");
    return rpcTicket(data);
  },

  async updateTicket(ticket: Ticket, _userId: string): Promise<Ticket> {
    const previous = await getTicket(ticket.id);
    if (previous.column !== ticket.column) {
      const { data, error } = await insforge.database.rpc("move_dev_board_ticket", {
        p_ticket_id: ticket.id,
        p_column_id: ticket.column,
      });
      if (error) throw failure(error, "Failed to move ticket.");
      return rpcTicket(data);
    }
    if (previous.timerStartedAt !== ticket.timerStartedAt || previous.isPaused !== ticket.isPaused) {
      const { data, error } = await insforge.database.rpc("set_dev_board_ticket_timer", {
        p_ticket_id: ticket.id,
        p_action: ticket.isPaused ? "pause" : "resume",
      });
      if (error) throw failure(error, "Failed to update timer.");
      return rpcTicket(data);
    }
    const { data, error } = await insforge.database.rpc("update_dev_board_ticket", {
      p_ticket_id: ticket.id,
      p_title: ticket.title,
      p_description: ticket.description,
      p_priority: ticket.priority,
    });
    if (error) throw failure(error, "Failed to update ticket.");
    return rpcTicket(data);
  },

  async deleteTicket(ticketId: string): Promise<void> {
    const { error } = await insforge.database.rpc("delete_dev_board_ticket", {
      p_ticket_id: ticketId,
    });
    if (error) throw failure(error, "Failed to delete ticket.");
  },
};

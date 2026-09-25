import "server-only";

import { z } from "zod";

import { createInsForgeServerClient } from "@/lib/insforge/server";
import type { TicketTimeAdjustInput } from "../schemas/ticket";
import type { TimeEntry } from "../types/analytics";
import {
  type ColumnId,
  type ColumnPage,
  type Ticket,
  type TicketComment,
  COLUMNS,
  TICKETS_PAGE_SIZE,
} from "../types/board";
import { TICKET_COLUMNS, ticketRowSchema, toTicket } from "../utils/ticket-row";

const ticketCommentRowSchema = z.object({
  id: z.string(),
  ticket_id: z.string(),
  body: z.string(),
  author: z.enum(["user", "agent"]),
  created_at: z.string(),
});

const timeEntryRowSchema = z.object({
  id: z.string(),
  ticket_id: z.string(),
  started_at: z.string(),
  ended_at: z.string(),
  duration_ms: z.coerce.number(),
});

export interface TicketPage {
  tickets: Ticket[];
  nextCursor: string | null;
  total: number;
}

const COMMENT_COLUMNS = "id,ticket_id,body,author,created_at";

const TIME_ENTRY_COLUMNS = "id,ticket_id,started_at,ended_at,duration_ms";

function toTicketComment(value: unknown): TicketComment {
  const row = ticketCommentRowSchema.parse(value);
  return {
    id: row.id,
    ticketId: row.ticket_id,
    author: row.author,
    body: row.body,
    createdAt: row.created_at,
  };
}

function toTimeEntry(value: unknown): TimeEntry {
  const row = timeEntryRowSchema.parse(value);
  return {
    id: row.id,
    ticketId: row.ticket_id,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    durationMs: row.duration_ms,
  };
}

function rpcTicket(value: unknown): Ticket {
  if (Array.isArray(value)) return toTicket(value[0]);
  return toTicket(value);
}

function failure(error: { message?: string } | null, fallback: string): Error {
  return new Error(error?.message || fallback);
}

type InsForgeClient = Awaited<ReturnType<typeof createInsForgeServerClient>>;

async function readTicket(insforge: InsForgeClient, ticketId: string): Promise<Ticket | null> {
  const { data, error } = await insforge.database
    .from("dev_board_tickets")
    .select(TICKET_COLUMNS)
    .eq("id", ticketId)
    .maybeSingle();
  if (error) throw failure(error, "Ticket not found.");
  if (!data) return null;
  return toTicket(data);
}

async function getTicket(insforge: InsForgeClient, ticketId: string): Promise<Ticket> {
  const ticket = await readTicket(insforge, ticketId);
  if (!ticket) throw new Error("Ticket not found.");
  return ticket;
}

async function commentCounts(
  insforge: InsForgeClient,
  ticketIds: string[],
): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  if (ticketIds.length === 0) return counts;

  const { data, error } = await insforge.database
    .from("dev_board_ticket_comments")
    .select("ticket_id")
    .in("ticket_id", ticketIds);
  if (error) throw failure(error, "Failed to load ticket comments.");

  const rows = z.object({ ticket_id: z.string() }).array().parse(data);
  for (const row of rows) {
    counts.set(row.ticket_id, (counts.get(row.ticket_id) ?? 0) + 1);
  }
  return counts;
}

function handoff(ticket: Ticket): { p_branch: string; p_pr_url: string } {
  return {
    p_branch: ticket.branch ?? "",
    p_pr_url: ticket.prUrl ?? "",
  };
}

export const devBoardService = {
  async getTicket(ticketId: string): Promise<Ticket | null> {
    const insforge = await createInsForgeServerClient();
    return readTicket(insforge, ticketId);
  },

  async fetchTicketPage(
    projectId: string,
    column: ColumnId,
    cursor: string | null,
  ): Promise<TicketPage> {
    const insforge = await createInsForgeServerClient();
    const offset = cursor ? Number(cursor) : 0;
    const { data, error, count } = await insforge.database
      .from("dev_board_tickets")
      .select(TICKET_COLUMNS, { count: "exact" })
      .eq("project_id", projectId)
      .eq("column_id", column)
      .order("created_at", { ascending: false })
      .range(offset, offset + TICKETS_PAGE_SIZE - 1);
    if (error) throw failure(error, "Failed to load tickets.");
    const tickets = ticketRowSchema.array().parse(data).map(toTicket);
    const counts = await commentCounts(
      insforge,
      tickets.map((ticket) => ticket.id),
    );
    const nextOffset = offset + tickets.length;
    return {
      tickets: tickets.map((ticket) => ({
        ...ticket,
        commentCount: counts.get(ticket.id) ?? 0,
      })),
      nextCursor: tickets.length === TICKETS_PAGE_SIZE ? String(nextOffset) : null,
      total: count ?? tickets.length,
    };
  },

  async fetchBoardPages(projectId: string): Promise<ColumnPage[]> {
    return Promise.all(
      COLUMNS.map(async (column) => ({
        column,
        ...(await devBoardService.fetchTicketPage(projectId, column, null)),
      })),
    );
  },

  async createTicket(input: {
    projectId: string;
    title: string;
    description: string;
    priority: Ticket["priority"];
  }): Promise<Ticket> {
    const insforge = await createInsForgeServerClient();
    const { data, error } = await insforge.database.rpc("create_dev_board_ticket", {
      p_project_id: input.projectId,
      p_title: input.title,
      p_description: input.description,
      p_column_id: "backlog",
      p_priority: input.priority,
    });
    if (error) throw failure(error, "Failed to create ticket.");
    return rpcTicket(data);
  },

  async updateTicket(ticket: Ticket): Promise<Ticket> {
    const insforge = await createInsForgeServerClient();
    const previous = await getTicket(insforge, ticket.id);
    if (previous.column !== ticket.column) {
      const { data, error } = await insforge.database.rpc("move_dev_board_ticket", {
        p_ticket_id: ticket.id,
        p_column_id: ticket.column,
        ...handoff(ticket),
      });
      if (error) throw failure(error, "Failed to move ticket.");
      return rpcTicket(data);
    }
    if (
      previous.timerStartedAt !== ticket.timerStartedAt ||
      previous.isPaused !== ticket.isPaused
    ) {
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
      ...handoff(ticket),
    });
    if (error) throw failure(error, "Failed to update ticket.");
    return rpcTicket(data);
  },

  async adjustTicketTime(input: TicketTimeAdjustInput): Promise<Ticket> {
    const insforge = await createInsForgeServerClient();
    const { data, error } = await insforge.database.rpc("adjust_dev_board_ticket_time", {
      p_ticket_id: input.ticketId,
      p_action: input.action,
      p_ended_at: input.action === "stop_at" ? input.endedAt : null,
      p_duration_ms:
        input.action === "set_last_duration" || input.action === "set_total"
          ? input.durationMs
          : null,
    });
    if (error) throw failure(error, "Failed to adjust ticket time.");
    return rpcTicket(data);
  },

  async lastTimeEntry(ticketId: string): Promise<TimeEntry | null> {
    const insforge = await createInsForgeServerClient();
    const { data, error } = await insforge.database
      .from("dev_board_time_entries")
      .select(TIME_ENTRY_COLUMNS)
      .eq("ticket_id", ticketId)
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw failure(error, "Failed to load ticket time entries.");
    return data ? toTimeEntry(data) : null;
  },

  async listComments(ticketId: string): Promise<TicketComment[]> {
    const insforge = await createInsForgeServerClient();
    await getTicket(insforge, ticketId);
    const { data, error } = await insforge.database
      .from("dev_board_ticket_comments")
      .select(COMMENT_COLUMNS)
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: true });
    if (error) throw failure(error, "Failed to load ticket comments.");
    return ticketCommentRowSchema.array().parse(data).map(toTicketComment);
  },

  async createComment(ticketId: string, body: string): Promise<TicketComment> {
    const insforge = await createInsForgeServerClient();
    const { data, error } = await insforge.database
      .from("dev_board_ticket_comments")
      .insert([{ ticket_id: ticketId, body, author: "user" }])
      .select(COMMENT_COLUMNS)
      .single();
    if (error) throw failure(error, "Failed to create ticket comment.");
    return toTicketComment(data);
  },

  async deleteTicket(ticketId: string): Promise<void> {
    const insforge = await createInsForgeServerClient();
    const { error } = await insforge.database.rpc("delete_dev_board_ticket", {
      p_ticket_id: ticketId,
    });
    if (error) throw failure(error, "Failed to delete ticket.");
  },
};

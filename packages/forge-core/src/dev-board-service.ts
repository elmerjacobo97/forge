import type { InsForgeClient } from "@insforge/sdk";
import { asRecord, asRows, asSingleRow, stringField, throwIfError } from "./insforge-data.js";
import { COLUMNS, PRIORITIES } from "./types.js";
import type {
  ColumnId,
  CommentAuthor,
  NextTicketContext,
  Priority,
  Ticket,
  TicketComment,
  TicketCreateInput,
  TicketMoveInput,
  TicketTimeAdjustInput,
  TicketUpdateInput,
} from "./types.js";

function numberField(row: Record<string, unknown>, field: string): number {
  const value = row[field];
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`Invalid ticket row: ${field} must be a number.`);
  }
  return value;
}

function booleanField(row: Record<string, unknown>, field: string): boolean {
  const value = row[field];
  if (typeof value !== "boolean") {
    throw new Error(`Invalid ticket row: ${field} must be a boolean.`);
  }
  return value;
}

function nullableStringField(row: Record<string, unknown>, field: string): string | null {
  const value = row[field];
  if (value === null) return null;
  if (typeof value !== "string") {
    throw new Error(`Invalid ticket row: ${field} must be a string or null.`);
  }
  return value;
}

function columnField(value: unknown): ColumnId {
  if (typeof value !== "string" || !(COLUMNS as readonly string[]).includes(value)) {
    throw new Error(`Invalid ticket row: column_id must be one of ${COLUMNS.join(", ")}.`);
  }
  return value as ColumnId;
}

function priorityField(value: unknown): Priority {
  if (typeof value !== "string" || !(PRIORITIES as readonly string[]).includes(value)) {
    throw new Error(`Invalid ticket row: priority must be one of ${PRIORITIES.join(", ")}.`);
  }
  return value as Priority;
}

export function mapRowToTicket(value: unknown): Ticket {
  const row = asRecord(value, "ticket row");
  return {
    id: stringField(row, "id", "ticket row"),
    projectId: stringField(row, "project_id", "ticket row"),
    title: stringField(row, "title", "ticket row"),
    description: stringField(row, "description", "ticket row"),
    column: columnField(row.column_id),
    position: numberField(row, "position"),
    priority: priorityField(row.priority),
    createdAt: stringField(row, "created_at", "ticket row"),
    timerStartedAt: nullableStringField(row, "timer_started_at"),
    totalElapsedMs: numberField(row, "total_elapsed_ms"),
    isPaused: booleanField(row, "is_paused"),
    lastMovedAt: stringField(row, "last_moved_at", "ticket row"),
    branch: nullableStringField(row, "branch"),
    prUrl: nullableStringField(row, "pr_url"),
  };
}

function commentAuthorField(value: unknown): CommentAuthor {
  if (value !== "user" && value !== "agent") {
    throw new Error("Invalid ticket comment row: author must be user or agent.");
  }
  return value;
}

export function mapRowToTicketComment(value: unknown): TicketComment {
  const row = asRecord(value, "ticket comment row");
  return {
    id: stringField(row, "id", "ticket comment row"),
    ticketId: stringField(row, "ticket_id", "ticket comment row"),
    author: commentAuthorField(row.author),
    body: stringField(row, "body", "ticket comment row"),
    createdAt: stringField(row, "created_at", "ticket comment row"),
  };
}

function compareCandidates(a: Ticket, b: Ticket): number {
  const rank = { high: 0, med: 1, low: 2 };
  const byPriority = rank[a.priority] - rank[b.priority];
  if (byPriority !== 0) return byPriority;
  return b.createdAt.localeCompare(a.createdAt);
}

export type DevBoardServiceDeps = { client: InsForgeClient };

export function createDevBoardService({ client }: DevBoardServiceDeps) {
  async function get(id: string): Promise<Ticket> {
    const response = await client.database
      .from("dev_board_tickets")
      .select(
        "id,project_id,title,description,column_id,position,priority,created_at,timer_started_at,total_elapsed_ms,is_paused,last_moved_at,branch,pr_url",
      )
      .eq("id", id)
      .maybeSingle();
    throwIfError(response.error, "Failed to get ticket.");
    const data: unknown = response.data;
    if (data === null) throw new Error("Ticket not found.");
    return mapRowToTicket(data);
  }

  async function ticketRpc(
    name: string,
    params: Record<string, unknown>,
    fallback: string,
  ): Promise<Ticket> {
    const response = await client.database.rpc(name, params);
    throwIfError(response.error, fallback);
    const data: unknown = response.data;
    return mapRowToTicket(asSingleRow(data, `${name} response`));
  }

  async function listByColumn(column: ColumnId, projectId?: string): Promise<Ticket[]> {
    const tickets: Ticket[] = [];
    for (let from = 0; ; from += 100) {
      let query = client.database
        .from("dev_board_tickets")
        .select(
          "id,project_id,title,description,column_id,position,priority,created_at,timer_started_at,total_elapsed_ms,is_paused,last_moved_at,branch,pr_url",
        )
        .eq("column_id", column)
        .order("created_at", { ascending: false })
        .range(from, from + 100 - 1);
      if (projectId) query = query.eq("project_id", projectId);

      const response = await query;
      throwIfError(response.error, "Failed to list tickets.");
      const data: unknown = response.data;
      const rows = asRows(data, "ticket list");
      tickets.push(...rows.map(mapRowToTicket));
      if (rows.length < 100) return tickets;
    }
  }

  async function projectRefs(
    projectId?: string,
  ): Promise<Map<string, { id: string; name: string }>> {
    let query = client.database.from("dev_board_projects").select("id,name");
    if (projectId) query = query.eq("id", projectId);

    const response = await query;
    throwIfError(response.error, "Failed to load projects.");
    const data: unknown = response.data;
    const refs = new Map<string, { id: string; name: string }>();
    for (const value of asRows(data, "project list")) {
      const row = asRecord(value, "project row");
      const id = stringField(row, "id", "project row");
      refs.set(id, { id, name: stringField(row, "name", "project row") });
    }
    return refs;
  }

  async function listComments(ticketId: string): Promise<TicketComment[]> {
    const response = await client.database
      .from("dev_board_ticket_comments")
      .select("id,ticket_id,body,author,created_at")
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: true });
    throwIfError(response.error, "Failed to list ticket comments.");
    const data: unknown = response.data;
    return asRows(data, "ticket comment list").map(mapRowToTicketComment);
  }

  function handoffParams(input: {
    branch?: string;
    prUrl?: string;
    clearBranch?: boolean;
    clearPrUrl?: boolean;
  }): Record<string, unknown> {
    const params: Record<string, unknown> = {};
    if (input.clearBranch) params.p_branch = "";
    else if (input.branch !== undefined) params.p_branch = input.branch;
    if (input.clearPrUrl) params.p_pr_url = "";
    else if (input.prUrl !== undefined) params.p_pr_url = input.prUrl;
    return params;
  }

  return {
    async list(projectId: string, column?: ColumnId): Promise<Ticket[]> {
      const tickets: Ticket[] = [];
      for (let from = 0; ; from += 100) {
        let query = client.database
          .from("dev_board_tickets")
          .select(
            "id,project_id,title,description,column_id,position,priority,created_at,timer_started_at,total_elapsed_ms,is_paused,last_moved_at,branch,pr_url",
          )
          .eq("project_id", projectId)
          .order("created_at", { ascending: false })
          .range(from, from + 100 - 1);
        if (column) query = query.eq("column_id", column);

        const response = await query;
        throwIfError(response.error, "Failed to list tickets.");
        const data: unknown = response.data;
        const rows = asRows(data, "ticket list");
        tickets.push(...rows.map(mapRowToTicket));
        if (rows.length < 100) return tickets;
      }
    },

    get,

    listComments,

    async next(options: { projectId?: string } = {}): Promise<NextTicketContext> {
      const projectId = options.projectId;
      const refs = await projectRefs(projectId);
      const candidates = await listByColumn("todo", projectId);
      const activeTickets = [
        ...(await listByColumn("in_progress", projectId)),
        ...(await listByColumn("validation", projectId)),
      ];
      const [chosen] = [...candidates].sort(compareCandidates);
      const comments = chosen ? await listComments(chosen.id) : [];

      return {
        ticket: chosen ?? null,
        project: chosen ? (refs.get(chosen.projectId) ?? null) : null,
        comments,
        inProgress: activeTickets.map((ticket) => ({
          ticket,
          project: refs.get(ticket.projectId) ?? null,
        })),
      };
    },

    async addComment(
      ticketId: string,
      body: string,
      author: CommentAuthor,
    ): Promise<TicketComment> {
      await get(ticketId);
      const response = await client.database
        .from("dev_board_ticket_comments")
        .insert([{ ticket_id: ticketId, body, author }])
        .select("id,ticket_id,body,author,created_at")
        .single();
      throwIfError(response.error, "Failed to create ticket comment.");
      const data: unknown = response.data;
      return mapRowToTicketComment(data);
    },

    async create(input: TicketCreateInput): Promise<Ticket> {
      return ticketRpc(
        "create_dev_board_ticket",
        {
          p_project_id: input.projectId,
          p_title: input.title,
          p_description: input.description,
          p_column_id: input.column,
          p_priority: input.priority,
        },
        "Failed to create ticket.",
      );
    },

    async update(id: string, input: TicketUpdateInput): Promise<Ticket> {
      const previous = await get(id);
      return ticketRpc(
        "update_dev_board_ticket",
        {
          p_ticket_id: id,
          p_title: input.title ?? previous.title,
          p_description: input.description ?? previous.description,
          p_priority: input.priority ?? previous.priority,
          ...handoffParams(input),
        },
        "Failed to update ticket.",
      );
    },

    async move(input: TicketMoveInput): Promise<Ticket> {
      return ticketRpc(
        "move_dev_board_ticket",
        {
          p_ticket_id: input.id,
          p_column_id: input.column,
          ...handoffParams(input),
        },
        "Failed to move ticket.",
      );
    },

    async pauseTimer(id: string): Promise<Ticket> {
      return ticketRpc(
        "set_dev_board_ticket_timer",
        { p_ticket_id: id, p_action: "pause" },
        "Failed to pause ticket timer.",
      );
    },

    async resumeTimer(id: string): Promise<Ticket> {
      return ticketRpc(
        "set_dev_board_ticket_timer",
        { p_ticket_id: id, p_action: "resume" },
        "Failed to resume ticket timer.",
      );
    },

    async adjustTime(input: TicketTimeAdjustInput): Promise<Ticket> {
      const params =
        "set" in input
          ? { p_action: "set_last_duration", p_ended_at: null, p_duration_ms: input.set }
          : "removeLast" in input
            ? { p_action: "delete_last", p_ended_at: null, p_duration_ms: null }
            : { p_action: "stop_at", p_ended_at: input.stopAt, p_duration_ms: null };

      return ticketRpc(
        "adjust_dev_board_ticket_time",
        { p_ticket_id: input.id, ...params },
        "Failed to adjust ticket time.",
      );
    },

    async delete(id: string): Promise<void> {
      const response = await client.database.rpc("delete_dev_board_ticket", {
        p_ticket_id: id,
      });
      throwIfError(response.error, "Failed to delete ticket.");
      if (response.data !== true) {
        throw new Error("Invalid ticket delete response.");
      }
    },
  };
}

export type DevBoardService = ReturnType<typeof createDevBoardService>;

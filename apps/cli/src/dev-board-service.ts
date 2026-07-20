import type { InsForgeClient } from "@insforge/sdk"
import {
  asRecord,
  asRows,
  asSingleRow,
  stringField,
  throwIfError,
} from "./insforge-data.js"
import { COLUMNS, PRIORITIES } from "./types.js"
import type {
  ColumnId,
  Priority,
  Ticket,
  TicketCreateInput,
  TicketUpdateInput,
} from "./types.js"

const TABLE = "dev_board_tickets"
const SELECT_COLUMNS =
  "id,project_id,title,description,column_id,position,priority,created_at,timer_started_at,total_elapsed_ms,is_paused,last_moved_at"
const PAGE_SIZE = 100

function numberField(
  row: Record<string, unknown>,
  field: string,
): number {
  const value = row[field]
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`Invalid ticket row: ${field} must be a number.`)
  }
  return value
}

function booleanField(
  row: Record<string, unknown>,
  field: string,
): boolean {
  const value = row[field]
  if (typeof value !== "boolean") {
    throw new Error(`Invalid ticket row: ${field} must be a boolean.`)
  }
  return value
}

function nullableStringField(
  row: Record<string, unknown>,
  field: string,
): string | null {
  const value = row[field]
  if (value === null) return null
  if (typeof value !== "string") {
    throw new Error(`Invalid ticket row: ${field} must be a string or null.`)
  }
  return value
}

function columnField(value: unknown): ColumnId {
  if (
    typeof value !== "string" ||
    !(COLUMNS as readonly string[]).includes(value)
  ) {
    throw new Error(
      `Invalid ticket row: column_id must be one of ${COLUMNS.join(", ")}.`,
    )
  }
  return value as ColumnId
}

function priorityField(value: unknown): Priority {
  if (
    typeof value !== "string" ||
    !(PRIORITIES as readonly string[]).includes(value)
  ) {
    throw new Error(
      `Invalid ticket row: priority must be one of ${PRIORITIES.join(", ")}.`,
    )
  }
  return value as Priority
}

export function mapRowToTicket(value: unknown): Ticket {
  const row = asRecord(value, "ticket row")
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
  }
}

export type DevBoardServiceDeps = { client: InsForgeClient }

export function createDevBoardService({ client }: DevBoardServiceDeps) {
  async function get(id: string): Promise<Ticket> {
    const response = await client.database
      .from(TABLE)
      .select(SELECT_COLUMNS)
      .eq("id", id)
      .maybeSingle()
    throwIfError(response.error, "Failed to get ticket.")
    const data: unknown = response.data
    if (data === null) throw new Error("Ticket not found.")
    return mapRowToTicket(data)
  }

  async function ticketRpc(
    name: string,
    params: Record<string, unknown>,
    fallback: string,
  ): Promise<Ticket> {
    const response = await client.database.rpc(name, params)
    throwIfError(response.error, fallback)
    const data: unknown = response.data
    return mapRowToTicket(asSingleRow(data, `${name} response`))
  }

  return {
    async list(projectId: string, column?: ColumnId): Promise<Ticket[]> {
      const tickets: Ticket[] = []
      for (let from = 0; ; from += PAGE_SIZE) {
        let query = client.database
          .from(TABLE)
          .select(SELECT_COLUMNS)
          .eq("project_id", projectId)
          .order("created_at", { ascending: false })
          .range(from, from + PAGE_SIZE - 1)
        if (column) query = query.eq("column_id", column)

        const response = await query
        throwIfError(response.error, "Failed to list tickets.")
        const data: unknown = response.data
        const rows = asRows(data, "ticket list")
        tickets.push(...rows.map(mapRowToTicket))
        if (rows.length < PAGE_SIZE) return tickets
      }
    },

    get,

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
      )
    },

    async update(id: string, input: TicketUpdateInput): Promise<Ticket> {
      const previous = await get(id)
      return ticketRpc(
        "update_dev_board_ticket",
        {
          p_ticket_id: id,
          p_title: input.title ?? previous.title,
          p_description: input.description ?? previous.description,
          p_priority: input.priority ?? previous.priority,
        },
        "Failed to update ticket.",
      )
    },

    async move(id: string, column: ColumnId): Promise<Ticket> {
      return ticketRpc(
        "move_dev_board_ticket",
        { p_ticket_id: id, p_column_id: column },
        "Failed to move ticket.",
      )
    },

    async pauseTimer(id: string): Promise<Ticket> {
      return ticketRpc(
        "set_dev_board_ticket_timer",
        { p_ticket_id: id, p_action: "pause" },
        "Failed to pause ticket timer.",
      )
    },

    async resumeTimer(id: string): Promise<Ticket> {
      return ticketRpc(
        "set_dev_board_ticket_timer",
        { p_ticket_id: id, p_action: "resume" },
        "Failed to resume ticket timer.",
      )
    },

    async delete(id: string): Promise<void> {
      const response = await client.database.rpc("delete_dev_board_ticket", {
        p_ticket_id: id,
      })
      throwIfError(response.error, "Failed to delete ticket.")
      if (response.data !== true) {
        throw new Error("Invalid ticket delete response.")
      }
    },
  }
}

export type DevBoardService = ReturnType<typeof createDevBoardService>

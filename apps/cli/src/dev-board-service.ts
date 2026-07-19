import {
  ID,
  Permission,
  Query,
  Role,
  type Models,
  type TablesDB,
} from "node-appwrite"
import {
  applyMoveTicket,
  nowISO,
  resolveUpdateEventType,
  startTimer,
} from "./dev-board-helpers.js"
import { COLUMNS, PRIORITIES } from "./types.js"
import type {
  ColumnId,
  ForgeConfig,
  Priority,
  Ticket,
  TicketCreateInput,
  TicketUpdateInput,
} from "./types.js"

const LIST_PAGE_SIZE = 100

type TicketRow = Models.DefaultRow & {
  projectId?: unknown
  title?: unknown
  description?: unknown
  column?: unknown
  position?: unknown
  priority?: unknown
  totalElapsedMs?: unknown
  timerStartedAt?: unknown
  isPaused?: unknown
  lastMovedAt?: unknown
  userId?: unknown
}

function asString(value: unknown, field: string): string {
  if (typeof value !== "string") {
    throw new Error(`Invalid ticket row: ${field} must be a string.`)
  }
  return value
}

function asNumber(value: unknown, field: string): number {
  if (typeof value !== "number" || Number.isNaN(value)) {
    throw new Error(`Invalid ticket row: ${field} must be a number.`)
  }
  return value
}

function asBoolean(value: unknown, field: string): boolean {
  if (typeof value !== "boolean") {
    throw new Error(`Invalid ticket row: ${field} must be a boolean.`)
  }
  return value
}

function asColumn(value: unknown): ColumnId {
  if (
    typeof value !== "string" ||
    !(COLUMNS as readonly string[]).includes(value)
  ) {
    throw new Error(
      `Invalid ticket row: column must be one of ${COLUMNS.join(", ")}.`,
    )
  }
  return value as ColumnId
}

function asPriority(value: unknown): Priority {
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

function asNullableString(value: unknown, field: string): string | null {
  if (value == null) return null
  if (typeof value !== "string") {
    throw new Error(`Invalid ticket row: ${field} must be a string or null.`)
  }
  return value
}

export function mapRowToTicket(row: TicketRow): Ticket {
  return {
    id: row.$id,
    projectId: asString(row.projectId, "projectId"),
    title: asString(row.title, "title"),
    description: asString(row.description, "description"),
    column: asColumn(row.column),
    position: asNumber(row.position, "position"),
    priority: asPriority(row.priority),
    createdAt: row.$createdAt,
    timerStartedAt: asNullableString(row.timerStartedAt, "timerStartedAt"),
    totalElapsedMs: asNumber(row.totalElapsedMs, "totalElapsedMs"),
    isPaused: asBoolean(row.isPaused, "isPaused"),
    lastMovedAt: asString(row.lastMovedAt, "lastMovedAt"),
  }
}

function assertOwnedByUser(row: TicketRow, userId: string): void {
  if (row.userId !== userId) {
    throw new Error("Ticket not found.")
  }
}

function formatAppwriteError(error: unknown, fallback: string): Error {
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as { message: unknown }).message === "string"
  ) {
    const code =
      "code" in error ? (error as { code: unknown }).code : undefined
    if (code === 404) {
      return new Error("Ticket not found.")
    }
    return new Error((error as { message: string }).message)
  }
  return new Error(fallback)
}

function privatePermissions(userId: string) {
  return [
    Permission.read(Role.user(userId)),
    Permission.update(Role.user(userId)),
    Permission.delete(Role.user(userId)),
  ]
}

function ticketData(ticket: Ticket, userId: string) {
  return {
    userId,
    projectId: ticket.projectId,
    title: ticket.title,
    description: ticket.description,
    column: ticket.column,
    position: ticket.position,
    priority: ticket.priority,
    totalElapsedMs: ticket.totalElapsedMs,
    timerStartedAt: ticket.timerStartedAt,
    isPaused: ticket.isPaused,
    lastMovedAt: ticket.lastMovedAt,
  }
}

function eventData(
  ticket: Ticket,
  userId: string,
  eventType: string,
  fromColumn?: ColumnId,
) {
  return {
    userId,
    ticketId: ticket.id,
    eventType,
    fromColumn,
    toColumn: ticket.column,
    occurredAt: ticket.lastMovedAt,
  }
}

export type DevBoardServiceDeps = {
  tablesDB: TablesDB
  config: ForgeConfig
  userId: string
}

export function createDevBoardService(deps: DevBoardServiceDeps) {
  const { tablesDB, config, userId } = deps
  const databaseId = config.databaseId
  const tableId = config.devBoardTicketsTableId
  const eventsTableId = config.devBoardEventsTableId
  const timeEntriesTableId = config.devBoardTimeEntriesTableId

  async function commitTransaction(
    operation: (transactionId: string) => Promise<void>,
  ): Promise<void> {
    const transaction = await tablesDB.createTransaction({})
    try {
      await operation(transaction.$id)
      await tablesDB.updateTransaction({
        transactionId: transaction.$id,
        commit: true,
      })
    } catch (error) {
      await tablesDB.updateTransaction({
        transactionId: transaction.$id,
        rollback: true,
      })
      throw error
    }
  }

  async function getOwnedRow(id: string): Promise<TicketRow> {
    try {
      const row = await tablesDB.getRow<TicketRow>({
        databaseId,
        tableId,
        rowId: id,
      })
      assertOwnedByUser(row, userId)
      return row
    } catch (error) {
      throw formatAppwriteError(error, "Failed to get ticket.")
    }
  }

  async function listColumnTickets(
    projectId: string,
    column: ColumnId,
  ): Promise<Ticket[]> {
    const tickets: Ticket[] = []
    let cursor: string | null = null

    for (;;) {
      const queries = [
        Query.equal("userId", userId),
        Query.equal("projectId", projectId),
        Query.equal("column", column),
        Query.orderDesc("position"),
        Query.limit(LIST_PAGE_SIZE),
      ]
      if (cursor) queries.push(Query.cursorAfter(cursor))

      const response = await tablesDB.listRows<TicketRow>({
        databaseId,
        tableId,
        queries,
      })
      const rows = response.rows
      tickets.push(...rows.map(mapRowToTicket))

      if (rows.length < LIST_PAGE_SIZE) break
      const last = rows[rows.length - 1]
      if (!last) break
      cursor = last.$id
    }

    return tickets
  }

  async function persistTicketUpdate(
    previous: Ticket,
    next: Ticket,
  ): Promise<Ticket> {
    const timerStartedAt = previous.timerStartedAt
    const stoppedTimer = timerStartedAt !== null && next.timerStartedAt === null
    const eventType = resolveUpdateEventType(previous, next)

    await commitTransaction(async (transactionId) => {
      await tablesDB.updateRow({
        databaseId,
        tableId,
        rowId: next.id,
        data: ticketData(next, userId),
        transactionId,
      })
      if (eventType) {
        await tablesDB.createRow({
          databaseId,
          tableId: eventsTableId,
          rowId: ID.unique(),
          data: eventData(next, userId, eventType, previous.column),
          permissions: privatePermissions(userId),
          transactionId,
        })
      }
      if (stoppedTimer && timerStartedAt) {
        const endedAt = new Date().toISOString()
        await tablesDB.createRow({
          databaseId,
          tableId: timeEntriesTableId,
          rowId: ID.unique(),
          data: {
            userId,
            ticketId: next.id,
            startedAt: timerStartedAt,
            endedAt,
            durationMs: Math.max(
              0,
              Date.parse(endedAt) - Date.parse(timerStartedAt),
            ),
          },
          permissions: privatePermissions(userId),
          transactionId,
        })
      }
    })

    return next
  }

  return {
    async list(projectId: string, column?: ColumnId): Promise<Ticket[]> {
      try {
        const tickets: Ticket[] = []
        let cursor: string | null = null

        for (;;) {
          const queries = [
            Query.equal("userId", userId),
            Query.equal("projectId", projectId),
            Query.orderDesc("$createdAt"),
            Query.limit(LIST_PAGE_SIZE),
          ]
          if (column) queries.push(Query.equal("column", column))
          if (cursor) queries.push(Query.cursorAfter(cursor))

          const response = await tablesDB.listRows<TicketRow>({
            databaseId,
            tableId,
            queries,
          })
          const rows = response.rows
          tickets.push(...rows.map(mapRowToTicket))

          if (rows.length < LIST_PAGE_SIZE) break
          const last = rows[rows.length - 1]
          if (!last) break
          cursor = last.$id
        }

        return tickets
      } catch (error) {
        throw formatAppwriteError(error, "Failed to list tickets.")
      }
    },

    async get(id: string): Promise<Ticket> {
      const row = await getOwnedRow(id)
      return mapRowToTicket(row)
    },

    async create(input: TicketCreateInput): Promise<Ticket> {
      const now = nowISO()
      let ticket: Ticket = {
        id: ID.unique(),
        projectId: input.projectId,
        title: input.title,
        description: input.description,
        column: input.column,
        position: Date.now(),
        priority: input.priority,
        createdAt: now,
        timerStartedAt: null,
        totalElapsedMs: 0,
        isPaused: false,
        lastMovedAt: now,
      }

      if (input.column === "in_progress") {
        ticket = startTimer(ticket)
      }

      try {
        await commitTransaction(async (transactionId) => {
          await tablesDB.createRow({
            databaseId,
            tableId,
            rowId: ticket.id,
            data: ticketData(ticket, userId),
            permissions: privatePermissions(userId),
            transactionId,
          })
          await tablesDB.createRow({
            databaseId,
            tableId: eventsTableId,
            rowId: ID.unique(),
            data: eventData(ticket, userId, "created"),
            permissions: privatePermissions(userId),
            transactionId,
          })
          if (ticket.column === "in_progress" && ticket.timerStartedAt) {
            await tablesDB.createRow({
              databaseId,
              tableId: eventsTableId,
              rowId: ID.unique(),
              data: eventData(ticket, userId, "started"),
              permissions: privatePermissions(userId),
              transactionId,
            })
          }
        })
        return ticket
      } catch (error) {
        throw formatAppwriteError(error, "Failed to create ticket.")
      }
    },

    async update(id: string, input: TicketUpdateInput): Promise<Ticket> {
      const previous = mapRowToTicket(await getOwnedRow(id))
      const next: Ticket = {
        ...previous,
        title: input.title ?? previous.title,
        description: input.description ?? previous.description,
        priority: input.priority ?? previous.priority,
      }

      try {
        await tablesDB.updateRow({
          databaseId,
          tableId,
          rowId: id,
          data: {
            title: next.title,
            description: next.description,
            priority: next.priority,
          },
        })
        return next
      } catch (error) {
        throw formatAppwriteError(error, "Failed to update ticket.")
      }
    },

    async move(id: string, column: ColumnId): Promise<Ticket> {
      const previous = mapRowToTicket(await getOwnedRow(id))

      if (previous.column === column) {
        return previous
      }

      try {
        const columnTickets = await listColumnTickets(
          previous.projectId,
          column,
        )
        const next = applyMoveTicket(previous, column, columnTickets)
        return await persistTicketUpdate(previous, next)
      } catch (error) {
        throw formatAppwriteError(error, "Failed to move ticket.")
      }
    },

    async delete(id: string): Promise<void> {
      await getOwnedRow(id)

      try {
        await tablesDB.deleteRow({
          databaseId,
          tableId,
          rowId: id,
        })
      } catch (error) {
        throw formatAppwriteError(error, "Failed to delete ticket.")
      }
    },
  }
}

export type DevBoardService = ReturnType<typeof createDevBoardService>

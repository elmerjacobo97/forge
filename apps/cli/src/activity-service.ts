import type { InsForgeClient } from "@insforge/sdk";
import { mapRowToTicketComment } from "./dev-board-service.js";
import { asRecord, asRows, stringField, throwIfError } from "./insforge-data.js";
import { COLUMNS, EVENT_TYPES } from "./types.js";
import type { ColumnId, TicketComment, TicketEvent, TicketEventType } from "./types.js";

const PAGE_SIZE = 100;
const EVENT_FIELDS = "id,ticket_id,event_type,from_column,to_column,occurred_at";
const COMMENT_FIELDS = "id,ticket_id,body,author,created_at";

function columnOrNull(value: unknown, field: string): ColumnId | null {
  if (value === null) return null;
  if (typeof value !== "string" || !(COLUMNS as readonly string[]).includes(value)) {
    throw new Error(`Invalid event row: ${field} must be one of ${COLUMNS.join(", ")} or null.`);
  }
  return value as ColumnId;
}

function eventTypeField(value: unknown): TicketEventType {
  if (typeof value !== "string" || !(EVENT_TYPES as readonly string[]).includes(value)) {
    throw new Error(`Invalid event row: event_type must be one of ${EVENT_TYPES.join(", ")}.`);
  }
  return value as TicketEventType;
}

export function mapRowToTicketEvent(value: unknown): TicketEvent {
  const row = asRecord(value, "ticket event row");
  return {
    id: stringField(row, "id", "ticket event row"),
    ticketId: stringField(row, "ticket_id", "ticket event row"),
    eventType: eventTypeField(row.event_type),
    fromColumn: columnOrNull(row.from_column, "from_column"),
    toColumn: columnOrNull(row.to_column, "to_column"),
    occurredAt: stringField(row, "occurred_at", "ticket event row"),
  };
}

export type ActivityServiceDeps = { client: InsForgeClient };

export function createActivityService({ client }: ActivityServiceDeps) {
  async function listEvents(from: string, to: string): Promise<TicketEvent[]> {
    const events: TicketEvent[] = [];
    for (let offset = 0; ; offset += PAGE_SIZE) {
      const response = await client.database
        .from("dev_board_events")
        .select(EVENT_FIELDS)
        .gte("occurred_at", from)
        .lte("occurred_at", to)
        .order("occurred_at", { ascending: true })
        .range(offset, offset + PAGE_SIZE - 1);
      throwIfError(response.error, "Failed to list ticket events.");
      const rows = asRows(response.data, "ticket event list");
      events.push(...rows.map(mapRowToTicketEvent));
      if (rows.length < PAGE_SIZE) return events;
    }
  }

  async function listCommentsInRange(from: string, to: string): Promise<TicketComment[]> {
    const comments: TicketComment[] = [];
    for (let offset = 0; ; offset += PAGE_SIZE) {
      const response = await client.database
        .from("dev_board_ticket_comments")
        .select(COMMENT_FIELDS)
        .gte("created_at", from)
        .lte("created_at", to)
        .order("created_at", { ascending: true })
        .range(offset, offset + PAGE_SIZE - 1);
      throwIfError(response.error, "Failed to list ticket comments.");
      const rows = asRows(response.data, "ticket comment list");
      comments.push(...rows.map(mapRowToTicketComment));
      if (rows.length < PAGE_SIZE) return comments;
    }
  }

  return { listEvents, listCommentsInRange };
}

export type ActivityService = ReturnType<typeof createActivityService>;

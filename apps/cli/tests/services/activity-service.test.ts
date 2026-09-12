import { describe, expect, it } from "vitest";
import { createActivityService, mapRowToTicketEvent } from "../../src/activity-service.js";
import { createDevBoardMockClient, type DevBoardMockCall } from "../helpers/insforge-client.js";

type Overrides = Record<string, unknown>;

function eventRow(overrides: Overrides = {}) {
  return {
    id: "event-1",
    ticket_id: "ticket-1",
    event_type: "moved",
    from_column: "todo",
    to_column: "in_progress",
    occurred_at: "2026-09-08T10:00:00.000Z",
    ...overrides,
  };
}

function commentRow(overrides: Overrides = {}) {
  return {
    id: "comment-1",
    ticket_id: "ticket-1",
    author: "agent",
    body: "Handoff",
    created_at: "2026-09-08T11:00:00.000Z",
    ...overrides,
  };
}

function hasCall(calls: DevBoardMockCall[], table: string, method: string, args: unknown[]) {
  return calls.some(
    (call) =>
      call.table === table &&
      call.method === method &&
      JSON.stringify(call.args) === JSON.stringify(args),
  );
}

describe("mapRowToTicketEvent", () => {
  it("maps a moved event row", () => {
    expect(mapRowToTicketEvent(eventRow())).toEqual({
      id: "event-1",
      ticketId: "ticket-1",
      eventType: "moved",
      fromColumn: "todo",
      toColumn: "in_progress",
      occurredAt: "2026-09-08T10:00:00.000Z",
    });
  });

  it("maps null columns for created events", () => {
    expect(
      mapRowToTicketEvent(
        eventRow({
          event_type: "created",
          from_column: null,
          to_column: null,
        }),
      ),
    ).toMatchObject({ eventType: "created", fromColumn: null, toColumn: null });
  });

  it("rejects invalid event types and columns", () => {
    expect(() => mapRowToTicketEvent(eventRow({ event_type: "archived" }))).toThrow(
      "event_type must be one of",
    );
    expect(() => mapRowToTicketEvent(eventRow({ to_column: "blocked" }))).toThrow(
      "to_column must be one of",
    );
  });
});

describe("createActivityService", () => {
  it("queries events inside the range in ascending order", async () => {
    const { client, calls } = createDevBoardMockClient({
      events: [eventRow()],
    });

    const events = await createActivityService({ client }).listEvents(
      "2026-09-04T00:00:00.000Z",
      "2026-09-11T00:00:00.000Z",
    );

    expect(events).toHaveLength(1);
    expect(
      hasCall(calls, "dev_board_events", "gte", ["occurred_at", "2026-09-04T00:00:00.000Z"]),
    ).toBe(true);
    expect(
      hasCall(calls, "dev_board_events", "lte", ["occurred_at", "2026-09-11T00:00:00.000Z"]),
    ).toBe(true);
    expect(hasCall(calls, "dev_board_events", "order", ["occurred_at", { ascending: true }])).toBe(
      true,
    );
  });

  it("filters events outside the range", async () => {
    const { client } = createDevBoardMockClient({
      events: [
        eventRow({ id: "inside", occurred_at: "2026-09-08T10:00:00.000Z" }),
        eventRow({ id: "before", occurred_at: "2026-08-01T10:00:00.000Z" }),
        eventRow({ id: "after", occurred_at: "2026-10-01T10:00:00.000Z" }),
      ],
    });

    const events = await createActivityService({ client }).listEvents(
      "2026-09-04T00:00:00.000Z",
      "2026-09-11T00:00:00.000Z",
    );

    expect(events.map((event) => event.id)).toEqual(["inside"]);
  });

  it("queries comments inside the range", async () => {
    const { client, calls } = createDevBoardMockClient({
      comments: [commentRow()],
    });

    const comments = await createActivityService({ client }).listCommentsInRange(
      "2026-09-04T00:00:00.000Z",
      "2026-09-11T00:00:00.000Z",
    );

    expect(comments).toEqual([
      {
        id: "comment-1",
        ticketId: "ticket-1",
        author: "agent",
        body: "Handoff",
        createdAt: "2026-09-08T11:00:00.000Z",
      },
    ]);
    expect(
      hasCall(calls, "dev_board_ticket_comments", "gte", [
        "created_at",
        "2026-09-04T00:00:00.000Z",
      ]),
    ).toBe(true);
    expect(
      hasCall(calls, "dev_board_ticket_comments", "order", ["created_at", { ascending: true }]),
    ).toBe(true);
  });
});

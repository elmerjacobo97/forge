import { beforeEach, describe, expect, it, vi } from "vitest";

const database = vi.hoisted(() => ({ from: vi.fn(), rpc: vi.fn() }));
const createInsForgeServerClient = vi.hoisted(() => vi.fn(async () => ({ database })));

vi.mock("@/lib/insforge/server", () => ({ createInsForgeServerClient }));

import { meetingsService } from "./meetings-service";

const meetingRow = {
  id: "meeting-1",
  project_id: null,
  title: "Weekly planning",
  meeting_at: "2026-09-26T10:00:00.000Z",
  attendees: ["Alex"],
  context: "Plan the next release.",
  decisions: ["Ship the smaller scope first."],
  created_at: "2026-09-26T10:00:00.000Z",
  updated_at: "2026-09-26T10:00:00.000Z",
};

const actionItemRow = {
  id: "action-1",
  meeting_id: "meeting-1",
  title: "Send the recap",
  details: "Share key decisions.",
  responsible_name: "Sam",
  due_date: "2026-09-30",
  is_completed: false,
  ticket_id: null,
  created_at: "2026-09-26T10:10:00.000Z",
  updated_at: "2026-09-26T10:10:00.000Z",
};

function makeQuery() {
  const query: Record<string, ReturnType<typeof vi.fn>> = {};
  for (const method of ["select", "eq", "or", "order", "insert", "update", "delete", "is", "in"]) {
    query[method] = vi.fn(() => query);
  }
  query.single = vi.fn();
  query.maybeSingle = vi.fn();
  query.range = vi.fn();
  query.then = vi.fn((resolve) =>
    Promise.resolve({ data: [actionItemRow], error: null }).then(resolve),
  );
  return query;
}

const filters = { q: "", projectId: null };

beforeEach(() => vi.clearAllMocks());

describe("meetingsService.fetchMeetingsPage", () => {
  it("maps rows and applies project, search, stable date order and bounded pagination", async () => {
    const query = makeQuery();
    query.range.mockResolvedValue({ data: [meetingRow], error: null, count: 3 });
    database.from.mockReturnValue(query);

    const page = await meetingsService.fetchMeetingsPage(
      { q: "release", projectId: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d" },
      20,
      10,
    );

    expect(page).toEqual({
      meetings: [
        {
          id: "meeting-1",
          projectId: null,
          title: "Weekly planning",
          meetingAt: meetingRow.meeting_at,
          attendees: ["Alex"],
          context: meetingRow.context,
          decisions: meetingRow.decisions,
          createdAt: meetingRow.created_at,
          updatedAt: meetingRow.updated_at,
        },
      ],
      total: 3,
    });
    expect(query.select).toHaveBeenCalledWith(
      "id,project_id,title,meeting_at,attendees,context,decisions,created_at,updated_at",
      { count: "exact" },
    );
    expect(query.eq).toHaveBeenCalledWith("project_id", "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d");
    expect(query.or).toHaveBeenCalledWith('title.ilike."%release%",context.ilike."%release%"');
    expect(query.order).toHaveBeenNthCalledWith(1, "meeting_at", { ascending: false });
    expect(query.order).toHaveBeenNthCalledWith(2, "id", { ascending: false });
    expect(query.range).toHaveBeenCalledWith(20, 29);
  });

  it("rejects invalid pagination and surfaces database errors", async () => {
    await expect(meetingsService.fetchMeetingsPage(filters, -1, 10)).rejects.toThrow(
      "non-negative integer",
    );
    await expect(meetingsService.fetchMeetingsPage(filters, 0, 101)).rejects.toThrow(
      "between 1 and 100",
    );

    const query = makeQuery();
    query.range.mockResolvedValue({ data: null, error: { message: "database unavailable" } });
    database.from.mockReturnValue(query);
    await expect(meetingsService.fetchMeetingsPage(filters, 0, 10)).rejects.toThrow(
      "database unavailable",
    );
  });
});

describe("meetingsService.getMeeting", () => {
  it("loads the meeting and its action items", async () => {
    const meetingQuery = makeQuery();
    meetingQuery.maybeSingle.mockResolvedValue({ data: meetingRow, error: null });
    const actionQuery = makeQuery();
    database.from.mockReturnValueOnce(meetingQuery).mockReturnValueOnce(actionQuery);

    await expect(meetingsService.getMeeting("meeting-1")).resolves.toMatchObject({
      id: "meeting-1",
      title: "Weekly planning",
      actionItems: [
        {
          id: "action-1",
          meetingId: "meeting-1",
          responsibleName: "Sam",
          dueDate: "2026-09-30",
          ticketId: null,
        },
      ],
    });
    expect(actionQuery.order).toHaveBeenCalledWith("created_at", { ascending: true });
    expect(actionQuery.order).toHaveBeenCalledWith("id", { ascending: true });
  });

  it("maps linked ticket details for a converted action item", async () => {
    const meetingQuery = makeQuery();
    meetingQuery.maybeSingle.mockResolvedValue({ data: meetingRow, error: null });
    const linkedItem = { ...actionItemRow, ticket_id: "ticket-1" };
    const actionQuery = makeQuery();
    actionQuery.then = vi.fn((resolve) =>
      Promise.resolve({ data: [linkedItem], error: null }).then(resolve),
    );
    const ticketQuery = makeQuery();
    ticketQuery.then = vi.fn((resolve) =>
      Promise.resolve({
        data: [
          {
            id: "ticket-1",
            project_id: "project-1",
            title: "Send the recap",
            column_id: "in_progress",
          },
        ],
        error: null,
      }).then(resolve),
    );
    database.from
      .mockReturnValueOnce(meetingQuery)
      .mockReturnValueOnce(actionQuery)
      .mockReturnValueOnce(ticketQuery);

    await expect(meetingsService.getMeeting("meeting-1")).resolves.toMatchObject({
      actionItems: [
        {
          ticketId: "ticket-1",
          linkedTicket: {
            id: "ticket-1",
            projectId: "project-1",
            title: "Send the recap",
            column: "in_progress",
          },
        },
      ],
    });
    expect(ticketQuery.in).toHaveBeenCalledWith("id", ["ticket-1"]);
  });
});

describe("meeting writes", () => {
  it("stores meeting data in snake_case and maps the created row", async () => {
    const query = makeQuery();
    query.single.mockResolvedValue({ data: meetingRow, error: null });
    database.from.mockReturnValue(query);

    await expect(
      meetingsService.createMeeting({
        projectId: null,
        title: "Weekly planning",
        meetingAt: meetingRow.meeting_at,
        attendees: ["Alex"],
        context: meetingRow.context,
        decisions: meetingRow.decisions,
      }),
    ).resolves.toMatchObject({ id: "meeting-1", projectId: null, title: "Weekly planning" });
    expect(query.insert).toHaveBeenCalledWith([
      {
        project_id: null,
        title: "Weekly planning",
        meeting_at: meetingRow.meeting_at,
        attendees: ["Alex"],
        context: meetingRow.context,
        decisions: meetingRow.decisions,
      },
    ]);
  });

  it("creates action items without a ticket and preserves responsible/due date", async () => {
    const query = makeQuery();
    query.single.mockResolvedValue({ data: actionItemRow, error: null });
    database.from.mockReturnValue(query);

    await expect(
      meetingsService.createActionItem("meeting-1", {
        title: "Send the recap",
        details: "Share key decisions.",
        responsibleName: "Sam",
        dueDate: "2026-09-30",
      }),
    ).resolves.toMatchObject({
      id: "action-1",
      responsibleName: "Sam",
      dueDate: "2026-09-30",
      ticketId: null,
    });
    expect(query.insert).toHaveBeenCalledWith([
      {
        meeting_id: "meeting-1",
        title: "Send the recap",
        details: "Share key decisions.",
        responsible_name: "Sam",
        due_date: "2026-09-30",
      },
    ]);
  });

  it("guards completion when an action item already has a ticket", async () => {
    const query = makeQuery();
    query.maybeSingle.mockResolvedValue({
      data: { id: "action-1", ticket_id: "ticket-1" },
      error: null,
    });
    database.from.mockReturnValue(query);

    await expect(meetingsService.setActionItemCompleted("action-1", true)).rejects.toThrow(
      "progress is tracked in Dev Board",
    );
    expect(query.update).not.toHaveBeenCalled();
  });

  it("converts an action item through the atomic RPC", async () => {
    const ticketRow = {
      id: "ticket-1",
      project_id: "project-1",
      title: "Send the recap",
      description: "Share key decisions.",
      column_id: "backlog",
      position: 0,
      priority: "med",
      created_at: "2026-09-26T10:20:00.000Z",
      timer_started_at: null,
      total_elapsed_ms: 0,
      is_paused: true,
      last_moved_at: "2026-09-26T10:20:00.000Z",
      branch: null,
      pr_url: null,
      responsible_name: "Sam",
    };
    database.rpc.mockResolvedValue({ data: ticketRow, error: null });

    await expect(
      meetingsService.createTicketFromActionItem("action-1", "project-1"),
    ).resolves.toMatchObject({
      id: "ticket-1",
      title: "Send the recap",
      projectId: "project-1",
      responsibleName: "Sam",
    });
    expect(database.rpc).toHaveBeenCalledWith("create_dev_board_ticket_from_meeting_action", {
      p_action_item_id: "action-1",
      p_project_id: "project-1",
    });
  });
});

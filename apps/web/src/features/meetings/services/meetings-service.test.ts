import { beforeEach, describe, expect, it, vi } from "vitest";

const database = vi.hoisted(() => ({ from: vi.fn() }));
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

function makeQuery() {
  const query: Record<string, ReturnType<typeof vi.fn>> = {};
  for (const method of ["select", "eq", "or", "order", "insert", "update", "delete"]) {
    query[method] = vi.fn(() => query);
  }
  query.single = vi.fn();
  query.maybeSingle = vi.fn();
  query.range = vi.fn();
  query.then = vi.fn((resolve) => Promise.resolve({ data: [], error: null }).then(resolve));
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
  it("loads and maps a meeting", async () => {
    const meetingQuery = makeQuery();
    meetingQuery.maybeSingle.mockResolvedValue({ data: meetingRow, error: null });
    database.from.mockReturnValue(meetingQuery);

    await expect(meetingsService.getMeeting("meeting-1")).resolves.toMatchObject({
      id: "meeting-1",
      title: "Weekly planning",
      projectId: null,
      context: meetingRow.context,
    });
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

  it("updates a meeting in snake_case and maps the returned row", async () => {
    const query = makeQuery();
    query.single.mockResolvedValue({
      data: { ...meetingRow, title: "Updated planning" },
      error: null,
    });
    database.from.mockReturnValue(query);

    await expect(
      meetingsService.updateMeeting("meeting-1", {
        projectId: null,
        title: "Updated planning",
        meetingAt: meetingRow.meeting_at,
        attendees: ["Alex"],
        context: meetingRow.context,
        decisions: meetingRow.decisions,
      }),
    ).resolves.toMatchObject({ id: "meeting-1", title: "Updated planning" });
    expect(query.update).toHaveBeenCalledWith({
      project_id: null,
      title: "Updated planning",
      meeting_at: meetingRow.meeting_at,
      attendees: ["Alex"],
      context: meetingRow.context,
      decisions: meetingRow.decisions,
    });
    expect(query.eq).toHaveBeenCalledWith("id", "meeting-1");
    expect(query.select).toHaveBeenCalledWith(
      "id,project_id,title,meeting_at,attendees,context,decisions,created_at,updated_at",
    );
  });

  it("surfaces update failures", async () => {
    const query = makeQuery();
    query.single.mockResolvedValue({ data: null, error: { message: "update denied" } });
    database.from.mockReturnValue(query);

    await expect(
      meetingsService.updateMeeting("meeting-1", {
        projectId: null,
        title: "Updated planning",
        meetingAt: meetingRow.meeting_at,
        attendees: [],
        context: "",
        decisions: [],
      }),
    ).rejects.toThrow("update denied");
  });

  it("deletes a meeting by id and confirms a row was removed", async () => {
    const query = makeQuery();
    query.then = vi.fn((resolve) =>
      Promise.resolve({ data: [{ id: "meeting-1" }], error: null }).then(resolve),
    );
    database.from.mockReturnValue(query);

    await expect(meetingsService.deleteMeeting("meeting-1")).resolves.toBeUndefined();
    expect(query.delete).toHaveBeenCalledOnce();
    expect(query.eq).toHaveBeenCalledWith("id", "meeting-1");
    expect(query.select).toHaveBeenCalledWith("id");
  });

  it("fails the delete when no meeting was removed", async () => {
    const query = makeQuery();
    query.then = vi.fn((resolve) => Promise.resolve({ data: [], error: null }).then(resolve));
    database.from.mockReturnValue(query);

    await expect(meetingsService.deleteMeeting("meeting-1")).rejects.toThrow("Meeting not found.");
  });

  it("surfaces delete failures", async () => {
    const query = makeQuery();
    query.then = vi.fn((resolve) =>
      Promise.resolve({ data: null, error: { message: "delete denied" } }).then(resolve),
    );
    database.from.mockReturnValue(query);

    await expect(meetingsService.deleteMeeting("meeting-1")).rejects.toThrow("delete denied");
  });
});

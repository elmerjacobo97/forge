import { beforeEach, describe, expect, it, vi } from "vitest";

const database = vi.hoisted(() => ({ from: vi.fn() }));
const createInsForgeServerClient = vi.hoisted(() => vi.fn(async () => ({ database })));

vi.mock("@/lib/insforge/server", () => ({ createInsForgeServerClient }));

import { listReviewInbox } from "./review-inbox-service";

interface QueryResult {
  data: unknown;
  error?: unknown;
}

function createQueryMock(result: QueryResult) {
  const query: Record<string, ReturnType<typeof vi.fn>> = {
    select: vi.fn(),
    in: vi.fn(),
    range: vi.fn(),
  };
  query.select.mockReturnValue(query);
  query.in.mockResolvedValue(result);
  query.range.mockResolvedValue(result);
  return query;
}

function routeTables(
  tickets: ReturnType<typeof createQueryMock>,
  projects: ReturnType<typeof createQueryMock>,
  comments: ReturnType<typeof createQueryMock>,
) {
  database.from.mockImplementation((table: string) => {
    if (table === "dev_board_projects") return projects;
    if (table === "dev_board_ticket_comments") return comments;
    return tickets;
  });
}

const activeProject = {
  id: "project-1",
  name: "Forge",
  status: "in_progress",
};

const completedProject = {
  id: "project-2",
  name: "Done work",
  status: "completed",
};

const archivedProject = {
  id: "project-archived",
  name: "Old",
  status: "archived",
};

beforeEach(() => vi.clearAllMocks());

describe("listReviewInbox", () => {
  it("drops archived projects, keeps a null prUrl, and orders by lastMovedAt", async () => {
    const tickets = createQueryMock({
      data: [
        {
          id: "ticket-2",
          project_id: "project-2",
          title: "Later move",
          column_id: "validation",
          pr_url: null,
          last_moved_at: "2026-09-03T00:00:00.000Z",
        },
        {
          id: "ticket-9",
          project_id: "project-1",
          title: "Tied later id",
          column_id: "review",
          pr_url: "https://github.com/acme/forge/pull/9",
          last_moved_at: "2026-09-01T00:00:00.000Z",
        },
        {
          id: "ticket-1",
          project_id: "project-1",
          title: "Oldest move",
          column_id: "review",
          pr_url: "https://github.com/acme/forge/pull/1",
          last_moved_at: "2026-09-01T00:00:00.000Z",
        },
        {
          id: "ticket-archived",
          project_id: "project-archived",
          title: "Hidden",
          column_id: "validation",
          pr_url: "https://github.com/acme/forge/pull/0",
          last_moved_at: "2026-08-01T00:00:00.000Z",
        },
      ],
      error: null,
    });
    const projects = createQueryMock({
      data: [activeProject, completedProject, archivedProject],
      error: null,
    });
    const comments = createQueryMock({
      data: [
        {
          ticket_id: "ticket-1",
          body: "older note",
          author: "user",
          created_at: "2026-09-01T00:00:00.000Z",
        },
        {
          ticket_id: "ticket-1",
          body: "newest\nnote",
          author: "agent",
          created_at: "2026-09-02T00:00:00.000Z",
        },
      ],
      error: null,
    });
    routeTables(tickets, projects, comments);

    const inbox = await listReviewInbox();

    expect(inbox.map((row) => row.ticketId)).toEqual(["ticket-1", "ticket-9", "ticket-2"]);
    expect(inbox.map((row) => row.projectName)).not.toContain("Old");
    expect(inbox.find((row) => row.ticketId === "ticket-2")).toMatchObject({
      prUrl: null,
      comment: null,
      column: "validation",
      projectName: "Done work",
    });
    expect(inbox.find((row) => row.ticketId === "ticket-1")?.comment).toEqual({
      author: "agent",
      excerpt: "newest note",
    });
    expect(tickets.in).toHaveBeenCalledWith("column_id", ["validation", "review"]);
    expect(tickets.range).not.toHaveBeenCalled();
    expect(comments.in).toHaveBeenCalledWith("ticket_id", ["ticket-2", "ticket-9", "ticket-1"]);
  });
});

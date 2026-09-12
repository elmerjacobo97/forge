import { beforeEach, describe, expect, it, vi } from "vitest";

const database = vi.hoisted(() => ({ from: vi.fn(), rpc: vi.fn() }));
const createInsForgeServerClient = vi.hoisted(() => vi.fn(async () => ({ database })));

vi.mock("@/lib/insforge/server", () => ({ createInsForgeServerClient }));

import { COLUMNS, type Ticket } from "../types/board";
import { devBoardService } from "./dev-board-service";

interface QueryResult {
  data: unknown;
  error?: unknown;
  count?: number | null;
}

function createQueryMock(result: QueryResult) {
  const query: Record<string, ReturnType<typeof vi.fn>> & {
    then?: (resolve: (value: QueryResult) => unknown) => unknown;
  } = {
    select: vi.fn(),
    eq: vi.fn(),
    order: vi.fn(),
    range: vi.fn(),
    in: vi.fn(),
    insert: vi.fn(),
    maybeSingle: vi.fn(),
    single: vi.fn(),
  };
  query.select.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  query.order.mockReturnValue(query);
  query.insert.mockReturnValue(query);
  query.range.mockResolvedValue(result);
  query.in.mockResolvedValue(result);
  query.maybeSingle.mockResolvedValue(result);
  query.single.mockResolvedValue(result);
  query.then = (resolve) => Promise.resolve(result).then(resolve);
  return query;
}

function routeTables(
  tickets: ReturnType<typeof createQueryMock>,
  comments?: ReturnType<typeof createQueryMock>,
) {
  database.from.mockImplementation((table: string) =>
    table === "dev_board_ticket_comments" && comments ? comments : tickets,
  );
}

const ticketRow = {
  id: "ticket-1",
  project_id: "project-1",
  title: "Ship CLI tickets",
  description: "",
  column_id: "todo",
  position: 0,
  priority: "med",
  created_at: "2026-09-01T00:00:00.000Z",
  timer_started_at: null,
  total_elapsed_ms: 0,
  is_paused: false,
  last_moved_at: "2026-09-01T00:00:00.000Z",
  branch: "dev/handoff",
  pr_url: "https://github.com/acme/forge/pull/17",
};

const commentRow = {
  id: "comment-1",
  ticket_id: "ticket-1",
  body: "Handoff notes",
  author: "user",
  created_at: "2026-09-02T00:00:00.000Z",
};

function ticket(overrides: Partial<Ticket> = {}): Ticket {
  return {
    id: "ticket-1",
    projectId: "project-1",
    title: "Ship CLI tickets",
    description: "",
    column: "todo",
    position: 0,
    priority: "med",
    createdAt: "2026-09-01T00:00:00.000Z",
    timerStartedAt: null,
    totalElapsedMs: 0,
    isPaused: false,
    lastMovedAt: "2026-09-01T00:00:00.000Z",
    branch: null,
    prUrl: null,
    ...overrides,
  };
}

beforeEach(() => vi.clearAllMocks());

describe("devBoardService.fetchTicketPage", () => {
  it("maps branch/PR and attaches comment counts", async () => {
    const tickets = createQueryMock({ data: [ticketRow], error: null, count: 1 });
    const comments = createQueryMock({
      data: [{ ticket_id: "ticket-1" }, { ticket_id: "ticket-1" }],
      error: null,
    });
    routeTables(tickets, comments);

    const page = await devBoardService.fetchTicketPage("project-1", "todo", null);

    expect(page.tickets).toEqual([
      expect.objectContaining({
        id: "ticket-1",
        branch: "dev/handoff",
        prUrl: "https://github.com/acme/forge/pull/17",
        commentCount: 2,
      }),
    ]);
    expect(comments.in).toHaveBeenCalledWith("ticket_id", ["ticket-1"]);
    expect(tickets.order).toHaveBeenCalledWith("created_at", { ascending: false });
    expect(tickets.range).toHaveBeenCalledWith(0, 24);
    expect(page.nextCursor).toBeNull();
    expect(page.total).toBe(1);
  });

  it("skips the comment count query on an empty page", async () => {
    const tickets = createQueryMock({ data: [], error: null, count: 0 });
    const comments = createQueryMock({ data: [], error: null });
    routeTables(tickets, comments);

    const page = await devBoardService.fetchTicketPage("project-1", "todo", null);

    expect(page.tickets).toEqual([]);
    expect(comments.in).not.toHaveBeenCalled();
  });
});

describe("devBoardService.fetchBoardPages", () => {
  it("fetches every column in COLUMNS order", async () => {
    const tickets = createQueryMock({ data: [ticketRow], error: null, count: 1 });
    const comments = createQueryMock({
      data: [{ ticket_id: "ticket-1" }],
      error: null,
    });
    routeTables(tickets, comments);

    const pages = await devBoardService.fetchBoardPages("project-1");

    expect(pages.map((page) => page.column)).toEqual([...COLUMNS]);
    expect(pages.every((page) => page.tickets.length === 1 && page.total === 1)).toBe(true);
    expect(tickets.eq).toHaveBeenCalledWith("column_id", "validation");
  });
});

describe("devBoardService comments", () => {
  it("lists comments in ascending order after checking the ticket", async () => {
    const tickets = createQueryMock({ data: ticketRow, error: null });
    const comments = createQueryMock({ data: [commentRow], error: null });
    routeTables(tickets, comments);

    const result = await devBoardService.listComments("ticket-1");

    expect(tickets.maybeSingle).toHaveBeenCalled();
    expect(comments.eq).toHaveBeenCalledWith("ticket_id", "ticket-1");
    expect(comments.order).toHaveBeenCalledWith("created_at", { ascending: true });
    expect(result).toEqual([
      {
        id: "comment-1",
        ticketId: "ticket-1",
        author: "user",
        body: "Handoff notes",
        createdAt: "2026-09-02T00:00:00.000Z",
      },
    ]);
  });

  it("fails when the ticket does not exist", async () => {
    const tickets = createQueryMock({ data: null, error: null });
    routeTables(tickets);

    await expect(devBoardService.listComments("missing")).rejects.toThrow("Ticket not found.");
  });

  it("creates a comment with the user author", async () => {
    const comments = createQueryMock({ data: commentRow, error: null });
    database.from.mockReturnValue(comments);

    const result = await devBoardService.createComment("ticket-1", "Handoff notes");

    expect(comments.insert).toHaveBeenCalledWith([
      { ticket_id: "ticket-1", body: "Handoff notes", author: "user" },
    ]);
    expect(result.author).toBe("user");
  });
});

describe("devBoardService.updateTicket handoff", () => {
  it("clears handoff fields with empty strings when null", async () => {
    const tickets = createQueryMock({ data: ticketRow, error: null });
    database.from.mockReturnValue(tickets);
    database.rpc.mockResolvedValue({ data: ticketRow, error: null });

    await devBoardService.updateTicket(ticket({ branch: null, prUrl: null }));

    expect(database.rpc).toHaveBeenCalledWith(
      "update_dev_board_ticket",
      expect.objectContaining({
        p_ticket_id: "ticket-1",
        p_branch: "",
        p_pr_url: "",
      }),
    );
  });

  it("sends handoff fields on a move in one RPC", async () => {
    const tickets = createQueryMock({ data: ticketRow, error: null });
    database.from.mockReturnValue(tickets);
    database.rpc.mockResolvedValue({
      data: { ...ticketRow, column_id: "review" },
      error: null,
    });

    await devBoardService.updateTicket(
      ticket({
        column: "review",
        branch: "dev/handoff",
        prUrl: "https://github.com/acme/forge/pull/17",
      }),
    );

    expect(database.rpc).toHaveBeenCalledWith(
      "move_dev_board_ticket",
      expect.objectContaining({
        p_column_id: "review",
        p_branch: "dev/handoff",
        p_pr_url: "https://github.com/acme/forge/pull/17",
      }),
    );
  });
});

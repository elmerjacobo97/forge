import { describe, expect, it } from "vitest";
import { createDevBoardService } from "../../src/dev-board-service.js";
import { createDevBoardMockClient, type DevBoardMockCall } from "../helpers/insforge-client.js";

type Overrides = Record<string, unknown>;

function ticketRow(overrides: Overrides = {}) {
  return {
    id: "ticket-1",
    project_id: "project-1",
    title: "Ticket",
    description: "",
    column_id: "todo",
    position: 0,
    priority: "med",
    created_at: "2026-09-01T00:00:00.000Z",
    timer_started_at: null,
    total_elapsed_ms: 0,
    is_paused: false,
    last_moved_at: "2026-09-01T00:00:00.000Z",
    branch: null,
    pr_url: null,
    ...overrides,
  };
}

function commentRow(overrides: Overrides = {}) {
  return {
    id: "comment-1",
    ticket_id: "ticket-1",
    author: "user",
    body: "Handoff",
    created_at: "2026-09-01T00:00:00.000Z",
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

const projects = [
  { id: "project-1", name: "Forge" },
  { id: "project-2", name: "Other" },
];

describe("devBoardService.next", () => {
  it("ranks candidates by priority and breaks ties by position desc", async () => {
    const { client } = createDevBoardMockClient({
      projects,
      tickets: [
        ticketRow({ id: "low", priority: "low", position: 500 }),
        ticketRow({ id: "med-bottom", priority: "med", position: 10 }),
        ticketRow({ id: "med-top", priority: "med", position: 50 }),
        ticketRow({ id: "high-low-pos", priority: "high", position: 1 }),
        ticketRow({ id: "high-top-pos", priority: "high", position: 9 }),
      ],
    });

    const context = await createDevBoardService({ client }).next();

    expect(context.ticket?.id).toBe("high-top-pos");
    expect(context.project).toEqual({ id: "project-1", name: "Forge" });
  });

  it("only considers todo tickets as candidates", async () => {
    const { client } = createDevBoardMockClient({
      projects,
      tickets: [
        ticketRow({
          id: "review",
          column_id: "review",
          priority: "high",
          position: 99,
        }),
        ticketRow({
          id: "in-progress",
          column_id: "in_progress",
          priority: "high",
          position: 98,
        }),
        ticketRow({ id: "todo", priority: "low", position: 1 }),
      ],
    });

    const context = await createDevBoardService({ client }).next();

    expect(context.ticket?.id).toBe("todo");
  });

  it("returns an empty context when there is no todo ticket", async () => {
    const { client } = createDevBoardMockClient({
      projects,
      tickets: [
        ticketRow({
          id: "in-progress",
          column_id: "in_progress",
          priority: "high",
          position: 5,
        }),
      ],
    });

    const context = await createDevBoardService({ client }).next();

    expect(context).toEqual({
      ticket: null,
      project: null,
      comments: [],
      inProgress: [
        {
          ticket: expect.objectContaining({ id: "in-progress" }),
          project: { id: "project-1", name: "Forge" },
        },
      ],
    });
  });

  it("filters candidates and inProgress by project id", async () => {
    const { client, calls } = createDevBoardMockClient({
      projects,
      tickets: [
        ticketRow({
          id: "other-todo",
          project_id: "project-2",
          priority: "high",
          position: 99,
        }),
        ticketRow({
          id: "project-todo",
          project_id: "project-1",
          priority: "low",
          position: 1,
        }),
        ticketRow({
          id: "project-in-progress",
          project_id: "project-1",
          column_id: "in_progress",
        }),
        ticketRow({
          id: "other-in-progress",
          project_id: "project-2",
          column_id: "in_progress",
        }),
      ],
    });

    const context = await createDevBoardService({ client }).next({
      projectId: "project-1",
    });

    expect(context.ticket?.id).toBe("project-todo");
    expect(context.inProgress.map((entry) => entry.ticket.id)).toEqual(["project-in-progress"]);
    expect(hasCall(calls, "dev_board_tickets", "eq", ["project_id", "project-1"])).toBe(true);
    expect(hasCall(calls, "dev_board_projects", "eq", ["id", "project-1"])).toBe(true);
  });

  it("includes the chosen ticket comments in ascending order", async () => {
    const { client, calls } = createDevBoardMockClient({
      projects,
      tickets: [ticketRow({ id: "ticket-9", priority: "high", position: 3 })],
      comments: [
        commentRow({ id: "comment-1", ticket_id: "ticket-9", author: "user" }),
        commentRow({
          id: "comment-2",
          ticket_id: "ticket-9",
          author: "agent",
          body: "Moving to review",
          created_at: "2026-09-02T00:00:00.000Z",
        }),
        commentRow({ id: "comment-other", ticket_id: "ticket-1" }),
      ],
    });

    const context = await createDevBoardService({ client }).next();

    expect(context.comments).toEqual([
      expect.objectContaining({ id: "comment-1", author: "user" }),
      expect.objectContaining({ id: "comment-2", author: "agent" }),
    ]);
    expect(hasCall(calls, "dev_board_ticket_comments", "eq", ["ticket_id", "ticket-9"])).toBe(true);
    expect(
      hasCall(calls, "dev_board_ticket_comments", "order", ["created_at", { ascending: true }]),
    ).toBe(true);
  });

  it("resolves project names for inProgress entries across projects", async () => {
    const { client } = createDevBoardMockClient({
      projects,
      tickets: [
        ticketRow({ id: "todo", project_id: "project-2" }),
        ticketRow({
          id: "in-progress-1",
          project_id: "project-1",
          column_id: "in_progress",
        }),
        ticketRow({
          id: "in-progress-2",
          project_id: "project-2",
          column_id: "in_progress",
        }),
      ],
    });

    const context = await createDevBoardService({ client }).next();

    expect(context.project).toEqual({ id: "project-2", name: "Other" });
    expect(context.inProgress).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ticket: expect.objectContaining({ id: "in-progress-1" }),
          project: { id: "project-1", name: "Forge" },
        }),
        expect.objectContaining({
          ticket: expect.objectContaining({ id: "in-progress-2" }),
          project: { id: "project-2", name: "Other" },
        }),
      ]),
    );
  });
});

describe("devBoardService comments", () => {
  it("lists comments in ascending order", async () => {
    const { client, calls } = createDevBoardMockClient({
      comments: [commentRow()],
    });

    const comments = await createDevBoardService({ client }).listComments(
      "ticket-1",
    );

    expect(comments).toEqual([
      {
        id: "comment-1",
        ticketId: "ticket-1",
        author: "user",
        body: "Handoff",
        createdAt: "2026-09-01T00:00:00.000Z",
      },
    ]);
    expect(
      hasCall(calls, "dev_board_ticket_comments", "eq", ["ticket_id", "ticket-1"]),
    ).toBe(true);
    expect(
      hasCall(calls, "dev_board_ticket_comments", "order", [
        "created_at",
        { ascending: true },
      ]),
    ).toBe(true);
  });

  it("creates a comment after checking the ticket exists", async () => {
    const { client, calls } = createDevBoardMockClient({
      tickets: [ticketRow({ id: "ticket-1" })],
    });

    const comment = await createDevBoardService({ client }).addComment(
      "ticket-1",
      "Moved to review",
      "agent",
    );

    expect(comment).toEqual({
      id: "inserted-1",
      ticketId: "ticket-1",
      author: "agent",
      body: "Moved to review",
      createdAt: "2026-09-01T00:00:00.000Z",
    });
    expect(hasCall(calls, "dev_board_tickets", "maybeSingle", [])).toBe(true);
    const insert = calls.find(
      (call) =>
        call.table === "dev_board_ticket_comments" && call.method === "insert",
    );
    expect(insert?.args[0]).toEqual([
      { ticket_id: "ticket-1", body: "Moved to review", author: "agent" },
    ]);
  });

  it("fails when the ticket does not exist", async () => {
    const { client } = createDevBoardMockClient({ tickets: [] });

    await expect(
      createDevBoardService({ client }).addComment("missing", "hello", "user"),
    ).rejects.toThrow("Ticket not found.");
  });
});

describe("devBoardService handoff", () => {
  it("passes branch and prUrl to the update RPC", async () => {
    const { client, rpcCalls } = createDevBoardMockClient({
      tickets: [ticketRow({ id: "ticket-1" })],
      rpc: () => ({
        data: ticketRow({
          id: "ticket-1",
          branch: "dev/handoff",
          pr_url: "https://github.com/acme/forge/pull/17",
        }),
        error: null,
      }),
    });

    const ticket = await createDevBoardService({ client }).update("ticket-1", {
      branch: "dev/handoff",
      prUrl: "https://github.com/acme/forge/pull/17",
    });

    expect(ticket.branch).toBe("dev/handoff");
    expect(rpcCalls[0].name).toBe("update_dev_board_ticket");
    expect(rpcCalls[0].params).toMatchObject({
      p_ticket_id: "ticket-1",
      p_branch: "dev/handoff",
      p_pr_url: "https://github.com/acme/forge/pull/17",
    });
  });

  it("translates clear flags to empty strings", async () => {
    const { client, rpcCalls } = createDevBoardMockClient({
      tickets: [ticketRow({ id: "ticket-1", branch: "old", pr_url: "https://x/pr/1" })],
      rpc: () => ({ data: ticketRow({ id: "ticket-1" }), error: null }),
    });

    await createDevBoardService({ client }).update("ticket-1", {
      clearBranch: true,
      clearPrUrl: true,
    });

    expect(rpcCalls[0].params).toMatchObject({ p_branch: "", p_pr_url: "" });
  });

  it("omits handoff params when they are not provided", async () => {
    const { client, rpcCalls } = createDevBoardMockClient({
      tickets: [ticketRow({ id: "ticket-1" })],
      rpc: () => ({ data: ticketRow({ id: "ticket-1" }), error: null }),
    });

    await createDevBoardService({ client }).update("ticket-1", {
      title: "Renamed",
    });

    expect("p_branch" in rpcCalls[0].params).toBe(false);
    expect("p_pr_url" in rpcCalls[0].params).toBe(false);
  });

  it("sends the handoff in a single move RPC", async () => {
    const { client, rpcCalls } = createDevBoardMockClient({
      rpc: () => ({
        data: ticketRow({
          id: "ticket-1",
          column_id: "review",
          branch: "dev/handoff",
          pr_url: "https://github.com/acme/forge/pull/17",
        }),
        error: null,
      }),
    });

    await createDevBoardService({ client }).move({
      id: "ticket-1",
      column: "review",
      branch: "dev/handoff",
      prUrl: "https://github.com/acme/forge/pull/17",
    });

    expect(rpcCalls).toHaveLength(1);
    expect(rpcCalls[0].name).toBe("move_dev_board_ticket");
    expect(rpcCalls[0].params).toMatchObject({
      p_ticket_id: "ticket-1",
      p_column_id: "review",
      p_branch: "dev/handoff",
      p_pr_url: "https://github.com/acme/forge/pull/17",
    });
  });
});

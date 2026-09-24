import { describe, expect, it } from "vitest";
import { createToolHandlers } from "../src/tools.js";
import {
  asForgeServices,
  comment,
  createMockServices,
  event,
  project,
  ticket,
} from "./helpers/mock-services.js";

describe("createToolHandlers", () => {
  it("lists projects through the projects service", async () => {
    const services = createMockServices();
    services.projects.list.mockResolvedValue([project("p1", "Forge")]);
    const handlers = createToolHandlers(asForgeServices(services));

    await expect(handlers.listProjects()).resolves.toEqual([project("p1", "Forge")]);
    expect(services.projects.list).toHaveBeenCalledTimes(1);
  });

  it("fetches one project and propagates business errors", async () => {
    const services = createMockServices();
    services.projects.get.mockResolvedValue(project("p1"));
    const handlers = createToolHandlers(asForgeServices(services));

    await handlers.getProject({ projectId: "p1" });
    expect(services.projects.get).toHaveBeenCalledWith("p1");

    services.projects.get.mockRejectedValue(new Error("Project not found."));
    await expect(handlers.getProject({ projectId: "missing" })).rejects.toThrow(
      "Project not found.",
    );
  });

  it("lists tickets as lightweight summaries", async () => {
    const services = createMockServices();
    services.board.list.mockResolvedValue([
      ticket("t1", { description: "long text", branch: "feat/x" }),
    ]);
    const handlers = createToolHandlers(asForgeServices(services));

    const summaries = await handlers.listTickets({ projectId: "p1", column: "todo" });

    expect(services.board.list).toHaveBeenCalledWith("p1", "todo");
    expect(summaries).toEqual([
      {
        id: "t1",
        projectId: "p1",
        title: "t1",
        column: "todo",
        priority: "med",
        branch: "feat/x",
        prUrl: null,
        createdAt: "2026-09-01T00:00:00.000Z",
      },
    ]);
    await handlers.listTickets({ projectId: "p1" });
    expect(services.board.list).toHaveBeenLastCalledWith("p1", undefined);
  });

  it("returns the next ticket context, scoped by project when given", async () => {
    const context = { ticket: null, project: null, comments: [], inProgress: [] };
    const services = createMockServices();
    services.board.next.mockResolvedValue(context);
    const handlers = createToolHandlers(asForgeServices(services));

    await expect(handlers.nextTicket()).resolves.toEqual(context);
    expect(services.board.next).toHaveBeenCalledWith({ projectId: undefined });

    await handlers.nextTicket({ projectId: "p2" });
    expect(services.board.next).toHaveBeenLastCalledWith({ projectId: "p2" });
  });

  it("returns a ticket with its comment thread", async () => {
    const services = createMockServices();
    services.board.get.mockResolvedValue(ticket("t1"));
    services.board.listComments.mockResolvedValue([
      comment("c1", "t1", "2026-09-02T00:00:00.000Z"),
    ]);
    const handlers = createToolHandlers(asForgeServices(services));

    const result = await handlers.getTicket({ ticketId: "t1" });

    expect(result.ticket.id).toBe("t1");
    expect(result.comments).toHaveLength(1);
    expect(services.board.listComments).toHaveBeenCalledWith("t1");
  });

  it("builds the activity report from projects, tickets, events, and comments", async () => {
    const services = createMockServices();
    services.projects.list.mockResolvedValue([project("p1", "Forge"), project("p2", "Tarjetly")]);
    services.board.list.mockImplementation(async (projectId: string) => {
      if (projectId === "p1") {
        return [
          ticket("t1", { title: "Active", column: "todo" }),
          ticket("tBacklog", { column: "backlog" }),
        ];
      }
      return [ticket("t2", { projectId: "p2", title: "Done", column: "done" })];
    });
    services.activity.listEvents.mockResolvedValue([event("e1", "t1", "2026-09-10T10:00:00.000Z")]);
    services.activity.listCommentsInRange.mockResolvedValue([
      comment("c1", "t2", "2026-09-10T11:00:00.000Z"),
    ]);
    const handlers = createToolHandlers(asForgeServices(services));

    const report = await handlers.activityReport({ days: 7 });

    expect(report.days).toBe(7);
    expect(report.tickets.map((entry) => entry.ticket.id)).toEqual(["t2", "t1"]);
    expect(report.tickets[1]?.project?.name).toBe("Forge");
    expect(services.activity.listEvents).toHaveBeenCalledWith(report.from, report.to);
    expect(services.activity.listCommentsInRange).toHaveBeenCalledWith(report.from, report.to);
  });

  it("scopes the report to one project and forwards the column filter", async () => {
    const services = createMockServices();
    services.projects.get.mockResolvedValue(project("p1", "Forge"));
    services.board.list.mockResolvedValue([
      ticket("t1", { column: "todo" }),
      ticket("t2", { column: "done" }),
    ]);
    services.activity.listEvents.mockResolvedValue([]);
    services.activity.listCommentsInRange.mockResolvedValue([
      comment("c1", "t1", "2026-09-10T10:00:00.000Z"),
      comment("c2", "t2", "2026-09-10T11:00:00.000Z"),
    ]);
    const handlers = createToolHandlers(asForgeServices(services));

    const report = await handlers.activityReport({ days: 3, projectId: "p1", columns: ["done"] });

    expect(services.projects.get).toHaveBeenCalledWith("p1");
    expect(services.projects.list).not.toHaveBeenCalled();
    expect(report.tickets.map((entry) => entry.ticket.id)).toEqual(["t2"]);
  });

  it("creates a ticket after the project exists", async () => {
    const created = ticket("t1", { title: "Ship it", column: "backlog" });
    const services = createMockServices();
    services.projects.get.mockResolvedValue(project("p1"));
    services.board.create.mockResolvedValue(created);
    const handlers = createToolHandlers(asForgeServices(services));

    await expect(
      handlers.createTicket({
        projectId: "p1",
        title: "Ship it",
        description: "",
        column: "backlog",
        priority: "med",
      }),
    ).resolves.toEqual(created);
    expect(services.projects.get).toHaveBeenCalledWith("p1");
    expect(services.board.create).toHaveBeenCalledWith({
      projectId: "p1",
      title: "Ship it",
      description: "",
      column: "backlog",
      priority: "med",
    });
  });

  it("propagates Project not found and does not create", async () => {
    const services = createMockServices();
    services.projects.get.mockRejectedValue(new Error("Project not found."));
    const handlers = createToolHandlers(asForgeServices(services));

    await expect(
      handlers.createTicket({
        projectId: "missing",
        title: "Ship it",
        description: "",
        column: "backlog",
        priority: "med",
      }),
    ).rejects.toThrow("Project not found.");
    expect(services.board.create).not.toHaveBeenCalled();
  });

  it("moves a ticket and forwards handoff only when present", async () => {
    const moved = ticket("t1", { column: "in_progress", branch: "feat/mcp" });
    const services = createMockServices();
    services.board.move.mockResolvedValue(moved);
    const handlers = createToolHandlers(asForgeServices(services));

    await expect(
      handlers.moveTicket({ ticketId: "t1", column: "in_progress", branch: "feat/mcp" }),
    ).resolves.toEqual(moved);
    expect(services.board.move).toHaveBeenCalledWith({
      id: "t1",
      column: "in_progress",
      branch: "feat/mcp",
    });

    await handlers.moveTicket({ ticketId: "t1", column: "done" });
    expect(services.board.move).toHaveBeenLastCalledWith({ id: "t1", column: "done" });
  });

  it("updates only handoff fields", async () => {
    const updated = ticket("t1", { prUrl: "https://github.com/org/repo/pull/1" });
    const services = createMockServices();
    services.board.update.mockResolvedValue(updated);
    const handlers = createToolHandlers(asForgeServices(services));

    await expect(
      handlers.updateTicket({
        ticketId: "t1",
        prUrl: "https://github.com/org/repo/pull/1",
        clearBranch: true,
      }),
    ).resolves.toEqual(updated);
    expect(services.board.update).toHaveBeenCalledWith("t1", {
      prUrl: "https://github.com/org/repo/pull/1",
      clearBranch: true,
    });
  });

  it("adds a comment as the agent", async () => {
    const created = comment("c1", "t1", "2026-09-10T00:00:00.000Z");
    const services = createMockServices();
    services.board.addComment.mockResolvedValue(created);
    const handlers = createToolHandlers(asForgeServices(services));

    await expect(handlers.addTicketComment({ ticketId: "t1", body: "noted" })).resolves.toEqual(
      created,
    );
    expect(services.board.addComment).toHaveBeenCalledWith("t1", "noted", "agent");
  });

  it("pauses and resumes the ticket timer", async () => {
    const paused = ticket("t1", { isPaused: true });
    const resumed = ticket("t1", { isPaused: false });
    const services = createMockServices();
    services.board.pauseTimer.mockResolvedValue(paused);
    services.board.resumeTimer.mockResolvedValue(resumed);
    const handlers = createToolHandlers(asForgeServices(services));

    await expect(handlers.pauseTicket({ ticketId: "t1" })).resolves.toEqual(paused);
    await expect(handlers.resumeTicket({ ticketId: "t1" })).resolves.toEqual(resumed);
    expect(services.board.pauseTimer).toHaveBeenCalledWith("t1");
    expect(services.board.resumeTimer).toHaveBeenCalledWith("t1");
  });
});

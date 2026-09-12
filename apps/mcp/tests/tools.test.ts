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
});

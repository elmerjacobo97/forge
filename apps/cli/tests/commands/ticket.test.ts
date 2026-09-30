import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Ticket } from "@forge/core";

const mocks = vi.hoisted(() => ({
  createAuthedClient: vi.fn(),
  createAuthedDevBoardService: vi.fn(),
  createDevBoardService: vi.fn(),
  createProjectsService: vi.fn(),
  createTicket: vi.fn(),
  updateTicket: vi.fn(),
  getProject: vi.fn(),
}));

vi.mock("../../src/insforge.js", () => ({
  createAuthedClient: mocks.createAuthedClient,
  createAuthedDevBoardService: mocks.createAuthedDevBoardService,
}));

vi.mock("@forge/core", async () => {
  const actual = await vi.importActual<typeof import("@forge/core")>("@forge/core");
  return {
    ...actual,
    createDevBoardService: mocks.createDevBoardService,
    createProjectsService: mocks.createProjectsService,
  };
});

import { runTicket } from "../../src/commands/ticket.js";

const sampleTicket: Ticket = {
  id: "t1",
  projectId: "p1",
  title: "Ticket planning",
  description: "",
  column: "todo",
  position: 1000,
  priority: "med",
  createdAt: "2026-09-28T00:00:00.000Z",
  timerStartedAt: null,
  totalElapsedMs: 0,
  isPaused: false,
  lastMovedAt: "2026-09-28T00:00:00.000Z",
  branch: null,
  prUrl: null,
  responsibleName: null,
  startDate: null,
  dueDate: null,
  complexity: null,
};

beforeEach(() => {
  vi.clearAllMocks();
  process.exitCode = 0;

  mocks.createAuthedClient.mockResolvedValue({ client: {} });
  mocks.createAuthedDevBoardService.mockResolvedValue({ update: mocks.updateTicket });
  mocks.createDevBoardService.mockReturnValue({ create: mocks.createTicket });
  mocks.createProjectsService.mockReturnValue({ get: mocks.getProject });
  mocks.createTicket.mockResolvedValue(sampleTicket);
  mocks.updateTicket.mockResolvedValue(sampleTicket);
  mocks.getProject.mockResolvedValue({ id: "p1" });

  vi.spyOn(process.stdout, "write").mockImplementation(() => true);
  vi.spyOn(process.stderr, "write").mockImplementation(() => true);
});

afterEach(() => {
  vi.restoreAllMocks();
  process.exitCode = undefined;
});

describe("ticket planning flags", () => {
  it("passes complexity and offset-aware dates to ticket creation", async () => {
    await runTicket([
      "create",
      "--project-id",
      "p1",
      "--title",
      "Plan release",
      "--complexity",
      "high",
      "--start-date",
      "2026-09-28T21:29:00-06:00",
      "--due-date",
      "2026-10-02T17:00:00-06:00",
    ]);

    expect(mocks.getProject).toHaveBeenCalledWith("p1");
    expect(mocks.createTicket).toHaveBeenCalledWith(
      expect.objectContaining({
        complexity: "high",
        startDate: "2026-09-28T21:29:00-06:00",
        dueDate: "2026-10-02T17:00:00-06:00",
      }),
    );
  });

  it("rejects dates without an explicit offset before contacting services", async () => {
    await runTicket([
      "create",
      "--project-id",
      "p1",
      "--title",
      "Plan release",
      "--start-date",
      "2026-09-28T21:29:00",
      "--json",
    ]);

    expect(mocks.createAuthedClient).not.toHaveBeenCalled();
    expect(mocks.createTicket).not.toHaveBeenCalled();
    expect(process.exitCode).toBe(1);
    expect(process.stderr.write).toHaveBeenCalledWith(expect.stringContaining('"error"'));
  });

  it("passes planning updates while omitting fields the user did not change", async () => {
    await runTicket([
      "update",
      "t1",
      "--complexity",
      "medium",
      "--start-date",
      "2026-09-28T21:29:00-06:00",
    ]);

    expect(mocks.updateTicket).toHaveBeenCalledWith("t1", {
      complexity: "medium",
      startDate: "2026-09-28T21:29:00-06:00",
    });
  });

  it("accepts clear flags before the ticket id and clears only explicit fields", async () => {
    await runTicket([
      "update",
      "--clear-start-date",
      "--clear-due-date",
      "--clear-complexity",
      "t1",
    ]);

    expect(mocks.updateTicket).toHaveBeenCalledWith("t1", {
      clearStartDate: true,
      clearDueDate: true,
      clearComplexity: true,
    });
  });

  it("rejects setting and clearing the same planning field together", async () => {
    await runTicket([
      "update",
      "t1",
      "--start-date",
      "2026-09-28T21:29:00-06:00",
      "--clear-start-date",
    ]);

    expect(mocks.updateTicket).not.toHaveBeenCalled();
    expect(process.exitCode).toBe(1);
  });

  it("keeps planning fields out of unrelated partial updates", async () => {
    await runTicket(["update", "t1", "--title", "Renamed"]);

    expect(mocks.updateTicket).toHaveBeenCalledWith("t1", { title: "Renamed" });
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";

const getCurrentUser = vi.hoisted(() => vi.fn());
vi.mock("@/features/auth/server", () => ({ getCurrentUser }));

const revalidatePath = vi.hoisted(() => vi.fn());
vi.mock("next/cache", () => ({ revalidatePath }));

const createComment = vi.hoisted(() => vi.fn());
const adjustTicketTime = vi.hoisted(() => vi.fn());
const lastTimeEntry = vi.hoisted(() => vi.fn());
const createProject = vi.hoisted(() => vi.fn());
const updateProject = vi.hoisted(() => vi.fn());
vi.mock("./services/dev-board-service", () => ({
  devBoardService: { createComment, adjustTicketTime, lastTimeEntry },
}));
vi.mock("./services/projects-service", () => ({
  projectsService: { createProject, updateProject },
}));

import {
  adjustTicketTimeAction,
  createProjectAction,
  createTicketCommentAction,
  getLastTimeEntryAction,
  updateProjectAction,
} from "./actions";
import type { Ticket } from "./types/board";

const ticketId = "d7f1ce67-cf72-4f8e-8545-f0d2fb4ec501";
const comment = {
  id: "comment-1",
  ticketId,
  author: "user" as const,
  body: "Handoff notes",
  createdAt: "2026-09-02T00:00:00.000Z",
};

beforeEach(() => vi.clearAllMocks());

const projectId = "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d";

describe("project actions", () => {
  it("requires a session before creating or updating a project", async () => {
    getCurrentUser.mockResolvedValue(null);

    await expect(
      createProjectAction({ name: "Forge", description: "", status: "planned" }),
    ).resolves.toMatchObject({ ok: false });
    await expect(
      updateProjectAction(projectId, { name: "Forge", description: "", status: "planned" }),
    ).resolves.toMatchObject({ ok: false });
    expect(createProject).not.toHaveBeenCalled();
    expect(updateProject).not.toHaveBeenCalled();
  });

  it("rejects invalid states at the action boundary", async () => {
    getCurrentUser.mockResolvedValue({ id: "user-1" });

    await expect(
      createProjectAction({ name: "Forge", description: "", status: "unknown" }),
    ).resolves.toMatchObject({ ok: false });
    await expect(
      updateProjectAction(projectId, { name: "Forge", description: "", status: "unknown" }),
    ).resolves.toMatchObject({ ok: false });
    expect(createProject).not.toHaveBeenCalled();
    expect(updateProject).not.toHaveBeenCalled();
  });

  it("forwards valid status values to project persistence", async () => {
    getCurrentUser.mockResolvedValue({ id: "user-1" });
    const project = {
      id: projectId,
      name: "Forge",
      description: "Dev tools",
      status: "in_progress",
      createdAt: "2026-09-23T00:00:00.000Z",
    };
    createProject.mockResolvedValue(project);
    updateProject.mockResolvedValue(project);

    const input = { name: "Forge", description: "Dev tools", status: "in_progress" };
    await expect(createProjectAction(input)).resolves.toEqual({ ok: true, data: project });
    await expect(updateProjectAction(projectId, input)).resolves.toEqual({
      ok: true,
      data: project,
    });
    expect(createProject).toHaveBeenCalledWith(input);
    expect(updateProject).toHaveBeenCalledWith(projectId, input);
    expect(revalidatePath).toHaveBeenNthCalledWith(1, "/dev-board", "layout");
    expect(revalidatePath).toHaveBeenNthCalledWith(2, "/dev-board", "layout");
  });
});

describe("createTicketCommentAction", () => {
  it("requires a session", async () => {
    getCurrentUser.mockResolvedValue(null);

    await expect(createTicketCommentAction(ticketId, "Hi")).resolves.toEqual({
      ok: false,
      message: "You must be signed in to comment.",
    });
    expect(createComment).not.toHaveBeenCalled();
  });

  it("rejects invalid ticket ids and bodies", async () => {
    getCurrentUser.mockResolvedValue({ id: "user-1" });

    await expect(createTicketCommentAction("nope", "Hi")).resolves.toEqual({
      ok: false,
      message: "Invalid ticket.",
    });
    await expect(createTicketCommentAction(ticketId, "   ")).resolves.toEqual({
      ok: false,
      message: "Comment is required",
    });
    expect(createComment).not.toHaveBeenCalled();
  });

  it("creates the comment with the trimmed body", async () => {
    getCurrentUser.mockResolvedValue({ id: "user-1" });
    createComment.mockResolvedValue(comment);

    await expect(createTicketCommentAction(ticketId, "  Handoff notes  ")).resolves.toEqual({
      ok: true,
      data: comment,
    });
    expect(createComment).toHaveBeenCalledWith(ticketId, "Handoff notes");
  });

  it("surfaces service failures", async () => {
    getCurrentUser.mockResolvedValue({ id: "user-1" });
    createComment.mockRejectedValue(new Error("boom"));

    await expect(createTicketCommentAction(ticketId, "Hi")).resolves.toEqual({
      ok: false,
      message: "boom",
    });
  });
});

const adjustedTicket: Ticket = {
  id: ticketId,
  projectId: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
  title: "Ship CLI tickets",
  description: "",
  column: "in_progress",
  position: 0,
  priority: "med",
  createdAt: "2026-09-01T00:00:00.000Z",
  timerStartedAt: null,
  totalElapsedMs: 3_600_000,
  isPaused: true,
  lastMovedAt: "2026-09-12T20:00:00.000Z",
  branch: null,
  prUrl: null,
};

describe("adjustTicketTimeAction", () => {
  it("requires a session", async () => {
    getCurrentUser.mockResolvedValue(null);

    await expect(adjustTicketTimeAction({ ticketId, action: "delete_last" })).resolves.toEqual({
      ok: false,
      message: "You must be signed in to adjust ticket time.",
    });
    expect(adjustTicketTime).not.toHaveBeenCalled();
  });

  it("rejects invalid payloads", async () => {
    getCurrentUser.mockResolvedValue({ id: "user-1" });

    await expect(
      adjustTicketTimeAction({ ticketId: "nope", action: "delete_last" }),
    ).resolves.toMatchObject({ ok: false });
    await expect(
      adjustTicketTimeAction({ ticketId, action: "set_last_duration", durationMs: -1 }),
    ).resolves.toMatchObject({ ok: false });
    await expect(adjustTicketTimeAction({ ticketId, action: "unknown" })).resolves.toMatchObject({
      ok: false,
    });
    expect(adjustTicketTime).not.toHaveBeenCalled();
  });

  it("forwards the parsed payload and returns the updated ticket", async () => {
    getCurrentUser.mockResolvedValue({ id: "user-1" });
    adjustTicketTime.mockResolvedValue(adjustedTicket);

    await expect(
      adjustTicketTimeAction({ ticketId, action: "set_last_duration", durationMs: 3_600_000 }),
    ).resolves.toEqual({ ok: true, data: adjustedTicket });
    expect(adjustTicketTime).toHaveBeenCalledWith({
      ticketId,
      action: "set_last_duration",
      durationMs: 3_600_000,
    });
  });

  it("surfaces service failures", async () => {
    getCurrentUser.mockResolvedValue({ id: "user-1" });
    adjustTicketTime.mockRejectedValue(new Error("boom"));

    await expect(adjustTicketTimeAction({ ticketId, action: "delete_last" })).resolves.toEqual({
      ok: false,
      message: "boom",
    });
  });
});

describe("getLastTimeEntryAction", () => {
  it("requires a session", async () => {
    getCurrentUser.mockResolvedValue(null);

    await expect(getLastTimeEntryAction(ticketId)).resolves.toEqual({
      ok: false,
      message: "You must be signed in to load ticket time.",
    });
    expect(lastTimeEntry).not.toHaveBeenCalled();
  });

  it("rejects invalid ticket ids", async () => {
    getCurrentUser.mockResolvedValue({ id: "user-1" });

    await expect(getLastTimeEntryAction("nope")).resolves.toEqual({
      ok: false,
      message: "Invalid ticket.",
    });
    expect(lastTimeEntry).not.toHaveBeenCalled();
  });

  it("returns the last entry", async () => {
    getCurrentUser.mockResolvedValue({ id: "user-1" });
    const entry = {
      id: "entry-1",
      ticketId,
      startedAt: "2026-09-12T10:00:00.000Z",
      endedAt: "2026-09-12T11:00:00.000Z",
      durationMs: 3_600_000,
    };
    lastTimeEntry.mockResolvedValue(entry);

    await expect(getLastTimeEntryAction(ticketId)).resolves.toEqual({ ok: true, data: entry });
    expect(lastTimeEntry).toHaveBeenCalledWith(ticketId);
  });

  it("surfaces service failures", async () => {
    getCurrentUser.mockResolvedValue({ id: "user-1" });
    lastTimeEntry.mockRejectedValue(new Error("boom"));

    await expect(getLastTimeEntryAction(ticketId)).resolves.toEqual({
      ok: false,
      message: "boom",
    });
  });
});

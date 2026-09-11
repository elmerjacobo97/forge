import { beforeEach, describe, expect, it, vi } from "vitest";

const getCurrentUser = vi.hoisted(() => vi.fn());
vi.mock("@/features/auth/server", () => ({ getCurrentUser }));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const createComment = vi.hoisted(() => vi.fn());
vi.mock("./services/dev-board-service", () => ({ devBoardService: { createComment } }));

import { createTicketCommentAction } from "./actions";

const ticketId = "d7f1ce67-cf72-4f8e-8545-f0d2fb4ec501";
const comment = {
  id: "comment-1",
  ticketId,
  author: "user" as const,
  body: "Handoff notes",
  createdAt: "2026-09-02T00:00:00.000Z",
};

beforeEach(() => vi.clearAllMocks());

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

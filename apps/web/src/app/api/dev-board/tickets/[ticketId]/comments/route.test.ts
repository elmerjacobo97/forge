import { beforeEach, describe, expect, it, vi } from "vitest";

const getCurrentUser = vi.hoisted(() => vi.fn());
vi.mock("@/features/auth/server", () => ({ getCurrentUser }));

const listComments = vi.hoisted(() => vi.fn());
vi.mock("@/features/dev-board/services/dev-board-service", () => ({
  devBoardService: { listComments },
}));

import { GET } from "./route";

const ticketId = "d7f1ce67-cf72-4f8e-8545-f0d2fb4ec501";

function invoke(id = ticketId) {
  return GET(new Request(`http://localhost/api/dev-board/tickets/${id}/comments`), {
    params: Promise.resolve({ ticketId: id }),
  });
}

beforeEach(() => vi.clearAllMocks());

describe("GET /api/dev-board/tickets/[ticketId]/comments", () => {
  it("returns 401 without a session", async () => {
    getCurrentUser.mockResolvedValue(null);

    const response = await invoke();

    expect(response.status).toBe(401);
    expect(listComments).not.toHaveBeenCalled();
  });

  it("returns 400 for an invalid ticket id", async () => {
    getCurrentUser.mockResolvedValue({ id: "user-1" });

    const response = await invoke("not-a-uuid");

    expect(response.status).toBe(400);
    expect(listComments).not.toHaveBeenCalled();
  });

  it("returns 404 when the ticket does not exist", async () => {
    getCurrentUser.mockResolvedValue({ id: "user-1" });
    listComments.mockRejectedValue(new Error("Ticket not found."));

    const response = await invoke();

    expect(response.status).toBe(404);
  });

  it("returns the comments payload", async () => {
    getCurrentUser.mockResolvedValue({ id: "user-1" });
    const comments = [
      {
        id: "comment-1",
        ticketId,
        author: "agent",
        body: "Moved to review",
        createdAt: "2026-09-02T00:00:00.000Z",
      },
    ];
    listComments.mockResolvedValue(comments);

    const response = await invoke();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ comments });
    expect(listComments).toHaveBeenCalledWith(ticketId);
  });

  it("returns 500 on other failures", async () => {
    getCurrentUser.mockResolvedValue({ id: "user-1" });
    listComments.mockRejectedValue(new Error("boom"));

    const response = await invoke();

    expect(response.status).toBe(500);
  });
});

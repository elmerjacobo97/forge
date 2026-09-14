// @vitest-environment jsdom

import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const realtimeMock = vi.hoisted(() => ({
  subscribe: vi.fn(),
  unsubscribe: vi.fn(),
  on: vi.fn(),
  off: vi.fn(),
}));

vi.mock("@/lib/insforge/browser", () => ({
  insforge: { realtime: realtimeMock },
}));

import { useBoardRealtime } from "./use-board-realtime";

const row = {
  id: "t1",
  project_id: "project-1",
  title: "Ticket",
  description: "",
  column_id: "todo",
  position: 10,
  priority: "med",
  created_at: "2026-07-20T00:00:00.000Z",
  timer_started_at: null,
  total_elapsed_ms: 0,
  is_paused: false,
  last_moved_at: "2026-07-20T00:00:00.000Z",
  branch: null,
  pr_url: null,
};

function handlerFor(event: string) {
  const call = realtimeMock.on.mock.calls.find(([name]) => name === event);
  return call?.[1] as (payload: unknown) => void;
}

describe("useBoardRealtime", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    realtimeMock.subscribe.mockResolvedValue({
      ok: true,
      channel: "dev-board:user-1",
      presence: { members: [] },
    });
  });

  it("subscribes to the user channel and dispatches board events", async () => {
    const onTicketChange = vi.fn();
    const onCommentChange = vi.fn();

    const { unmount } = renderHook(() =>
      useBoardRealtime("user-1", { onTicketChange, onCommentChange }),
    );

    await vi.waitFor(() => expect(realtimeMock.subscribe).toHaveBeenCalledWith("dev-board:user-1"));

    act(() => {
      handlerFor("dev-board:ticket")({ action: "insert", ticket: row });
      handlerFor("dev-board:comment")({ action: "insert", comment: { ticket_id: "t1" } });
    });

    expect(onTicketChange).toHaveBeenCalledWith(
      expect.objectContaining({ action: "insert", ticket: expect.objectContaining({ id: "t1" }) }),
    );
    expect(onCommentChange).toHaveBeenCalledWith({ ticketId: "t1" });

    unmount();

    expect(realtimeMock.off).toHaveBeenCalledWith("dev-board:ticket", expect.any(Function));
    expect(realtimeMock.off).toHaveBeenCalledWith("dev-board:comment", expect.any(Function));
    expect(realtimeMock.unsubscribe).toHaveBeenCalledWith("dev-board:user-1");
  });

  it("ignores malformed payloads", async () => {
    const onTicketChange = vi.fn();

    renderHook(() => useBoardRealtime("user-1", { onTicketChange, onCommentChange: vi.fn() }));

    await vi.waitFor(() => expect(realtimeMock.on).toHaveBeenCalled());

    act(() => {
      handlerFor("dev-board:ticket")({ action: "moved" });
    });

    expect(onTicketChange).not.toHaveBeenCalled();
  });

  it("warns without throwing when the subscription is rejected", async () => {
    realtimeMock.subscribe.mockResolvedValue({
      ok: false,
      channel: "dev-board:user-1",
      error: { code: "UNAUTHORIZED", message: "nope" },
    });
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    renderHook(() =>
      useBoardRealtime("user-1", { onTicketChange: vi.fn(), onCommentChange: vi.fn() }),
    );

    await vi.waitFor(() => expect(warn).toHaveBeenCalled());

    warn.mockRestore();
  });
});

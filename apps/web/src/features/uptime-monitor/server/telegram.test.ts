import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { sendTelegramMessage } from "./telegram";

describe("sendTelegramMessage", () => {
  it("sends a message and returns ok on success", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({ ok: true, result: {} }), { status: 200 }));

    const result = await sendTelegramMessage("bot-token", "chat-1", "hello", {
      fetchImpl,
    });

    expect(result).toEqual({ ok: true });
    expect(fetchImpl).toHaveBeenCalledWith(
      "https://api.telegram.org/bottoken/sendMessage".replace("token", "bot-token"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ chat_id: "chat-1", text: "hello" }),
      }),
    );
  });

  it("returns the Telegram error description on a non-2xx response", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ ok: false, description: "chat not found" }), { status: 400 }),
      );

    const result = await sendTelegramMessage("bot-token", "bad-chat", "hi", {
      fetchImpl,
    });

    expect(result).toEqual({ ok: false, message: "chat not found" });
  });

  it("returns a generic message when the error body has no description", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response("not json", { status: 500 }));

    const result = await sendTelegramMessage("bot-token", "chat-1", "hi", {
      fetchImpl,
    });

    expect(result).toEqual({
      ok: false,
      message: "Telegram request failed with status 500.",
    });
  });

  it("returns a failure result when fetch rejects (network error)", async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new Error("network down"));

    const result = await sendTelegramMessage("bot-token", "chat-1", "hi", {
      fetchImpl,
    });

    expect(result).toEqual({ ok: false, message: "network down" });
  });
});

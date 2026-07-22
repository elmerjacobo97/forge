import "server-only";

const TELEGRAM_API_BASE = "https://api.telegram.org";

export type SendTelegramMessageResult = { ok: true } | { ok: false; message: string };

type TelegramDeps = {
  fetchImpl?: typeof fetch;
};

function errorDescription(body: unknown, status: number): string {
  if (
    body &&
    typeof body === "object" &&
    "description" in body &&
    typeof (body as { description: unknown }).description === "string"
  ) {
    return (body as { description: string }).description;
  }
  return `Telegram request failed with status ${status}.`;
}

export async function sendTelegramMessage(
  botToken: string,
  chatId: string,
  text: string,
  deps: TelegramDeps = {},
): Promise<SendTelegramMessageResult> {
  const fetchImpl = deps.fetchImpl ?? fetch;

  let response: Response;
  try {
    response = await fetchImpl(`${TELEGRAM_API_BASE}/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text }),
    });
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Telegram request failed.",
    };
  }

  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    return { ok: false, message: errorDescription(body, response.status) };
  }
  return { ok: true };
}

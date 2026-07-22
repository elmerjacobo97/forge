import { randomBytes } from "node:crypto";

import { WEBHOOK_TOKEN_BYTES } from "../constants";

/** Opaque high-entropy token (hex of WEBHOOK_TOKEN_BYTES). */
export function generateWebhookToken(): string {
  return randomBytes(WEBHOOK_TOKEN_BYTES).toString("hex");
}

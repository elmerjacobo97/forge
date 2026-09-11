"use server";

import { revalidatePath } from "next/cache";
import { ZodError } from "zod";

import { getCurrentUser } from "@/features/auth/server";
import { createWebhookEndpointSchema } from "./schemas/webhook-inspector-schema";
import { webhookInspectorService } from "./services/webhook-inspector-service";
import type { WebhookEndpoint } from "./types";
import { WebhookEndpointLimitError } from "./utils/limits";

export type WebhookActionResult<T = void> = { ok: true; data: T } | { ok: false; message: string };

function actionError(error: unknown, fallback: string): WebhookActionResult<never> {
  if (error instanceof WebhookEndpointLimitError) {
    return { ok: false, message: error.message };
  }
  if (error instanceof ZodError) {
    return {
      ok: false,
      message: error.issues[0]?.message ?? "Invalid webhook endpoint input.",
    };
  }
  if (error instanceof Error && error.message) {
    return { ok: false, message: error.message };
  }
  return { ok: false, message: fallback };
}

export async function createWebhookEndpointAction(
  input: unknown,
): Promise<WebhookActionResult<WebhookEndpoint>> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, message: "Sign in to use Webhook Inspector." };
  }

  const parsed = createWebhookEndpointSchema.safeParse(input ?? { name: "" });
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Invalid webhook endpoint input.",
    };
  }

  try {
    const endpoint = await webhookInspectorService.createEndpoint(parsed.data, user.id);
    revalidatePath("/webhook-inspector");
    return { ok: true, data: endpoint };
  } catch (error) {
    return actionError(error, "Failed to create webhook endpoint.");
  }
}

export async function deleteWebhookEndpointAction(
  endpointId: unknown,
): Promise<WebhookActionResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, message: "Sign in to use Webhook Inspector." };
  }

  if (typeof endpointId !== "string" || endpointId.length === 0) {
    return { ok: false, message: "Invalid webhook endpoint." };
  }

  try {
    await webhookInspectorService.deleteEndpoint(endpointId, user.id);
    revalidatePath("/webhook-inspector");
    return { ok: true, data: undefined };
  } catch (error) {
    return actionError(error, "Failed to delete webhook endpoint.");
  }
}

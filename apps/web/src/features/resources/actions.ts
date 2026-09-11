"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getCurrentUser } from "@/features/auth/server";
import { resourceInputSchema } from "./schemas/resource-schema";
import { resourcesService } from "./services/resources-service";

export type ResourceActionResult = { ok: true } | { ok: false; message: string };

const resourceIdSchema = z.uuid();

function failure(error: unknown, fallback: string): ResourceActionResult {
  if (error instanceof Error && error.message) return { ok: false, message: error.message };
  return { ok: false, message: fallback };
}

async function isAuthenticated(): Promise<boolean> {
  return (await getCurrentUser()) !== null;
}

export async function createResourceAction(input: unknown): Promise<ResourceActionResult> {
  if (!(await isAuthenticated())) {
    return { ok: false, message: "Sign in to use Resources." };
  }

  const parsed = resourceInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  try {
    await resourcesService.createResource(parsed.data);
    revalidatePath("/resources");
    return { ok: true };
  } catch (error) {
    return failure(error, "Failed to create resource.");
  }
}

export async function updateResourceAction(
  resourceId: unknown,
  input: unknown,
): Promise<ResourceActionResult> {
  if (!(await isAuthenticated())) {
    return { ok: false, message: "Sign in to use Resources." };
  }

  const parsedId = resourceIdSchema.safeParse(resourceId);
  if (!parsedId.success) {
    return { ok: false, message: "Invalid resource id." };
  }

  const parsed = resourceInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  try {
    await resourcesService.updateResource(parsedId.data, parsed.data);
    revalidatePath("/resources");
    return { ok: true };
  } catch (error) {
    return failure(error, "Failed to update resource.");
  }
}

export async function deleteResourceAction(resourceId: unknown): Promise<ResourceActionResult> {
  if (!(await isAuthenticated())) {
    return { ok: false, message: "Sign in to use Resources." };
  }

  const parsedId = resourceIdSchema.safeParse(resourceId);
  if (!parsedId.success) {
    return { ok: false, message: "Invalid resource id." };
  }

  try {
    await resourcesService.deleteResource(parsedId.data);
    revalidatePath("/resources");
    return { ok: true };
  } catch (error) {
    return failure(error, "Failed to delete resource.");
  }
}

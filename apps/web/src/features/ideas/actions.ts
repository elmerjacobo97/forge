"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getCurrentUser } from "@/features/auth/server";
import { ideaInputSchema } from "./schemas/idea-schema";
import { ideasService } from "./services/ideas-service";

export type IdeaActionResult = { ok: true } | { ok: false; message: string };

const ideaIdSchema = z.uuid();

function failure(error: unknown, fallback: string): IdeaActionResult {
  if (error instanceof Error && error.message) return { ok: false, message: error.message };
  return { ok: false, message: fallback };
}

async function isAuthenticated(): Promise<boolean> {
  return (await getCurrentUser()) !== null;
}

export async function createIdeaAction(input: unknown): Promise<IdeaActionResult> {
  if (!(await isAuthenticated())) {
    return { ok: false, message: "Sign in to use Ideas." };
  }

  const parsed = ideaInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  try {
    await ideasService.createIdea(parsed.data);
    revalidatePath("/ideas");
    return { ok: true };
  } catch (error) {
    return failure(error, "Failed to create idea.");
  }
}

export async function updateIdeaAction(ideaId: unknown, input: unknown): Promise<IdeaActionResult> {
  if (!(await isAuthenticated())) {
    return { ok: false, message: "Sign in to use Ideas." };
  }

  const parsedId = ideaIdSchema.safeParse(ideaId);
  if (!parsedId.success) {
    return { ok: false, message: "Invalid idea id." };
  }

  const parsed = ideaInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  try {
    await ideasService.updateIdea(parsedId.data, parsed.data);
    revalidatePath("/ideas");
    return { ok: true };
  } catch (error) {
    return failure(error, "Failed to update idea.");
  }
}

export async function deleteIdeaAction(ideaId: unknown): Promise<IdeaActionResult> {
  if (!(await isAuthenticated())) {
    return { ok: false, message: "Sign in to use Ideas." };
  }

  const parsedId = ideaIdSchema.safeParse(ideaId);
  if (!parsedId.success) {
    return { ok: false, message: "Invalid idea id." };
  }

  try {
    await ideasService.deleteIdea(parsedId.data);
    revalidatePath("/ideas");
    return { ok: true };
  } catch (error) {
    return failure(error, "Failed to delete idea.");
  }
}

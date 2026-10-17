"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getCurrentUser } from "@/features/auth/server";
import { projectMapService } from "./services/project-map-service";

export type ProjectMapActionResult = { ok: true } | { ok: false; message: string };

const projectIdSchema = z.uuid();
const slugSchema = z
  .string()
  .max(60)
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/);

async function deleteItem(
  projectId: unknown,
  slug: unknown,
  remove: (projectId: string, slug: string) => Promise<void>,
  fallback: string,
): Promise<ProjectMapActionResult> {
  if ((await getCurrentUser()) === null) {
    return { ok: false, message: "You must be signed in to edit the project map." };
  }

  const parsedId = projectIdSchema.safeParse(projectId);
  const parsedSlug = slugSchema.safeParse(slug);
  if (!parsedId.success || !parsedSlug.success) return { ok: false, message: "Invalid input." };

  try {
    await remove(parsedId.data, parsedSlug.data);
    revalidatePath(`/dev-board/${parsedId.data}/flows`);
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error && error.message ? error.message : fallback,
    };
  }
}

export async function deleteProjectModuleAction(
  projectId: unknown,
  slug: unknown,
): Promise<ProjectMapActionResult> {
  return deleteItem(projectId, slug, projectMapService.deleteModule, "Failed to delete module.");
}

export async function deleteProjectFlowAction(
  projectId: unknown,
  slug: unknown,
): Promise<ProjectMapActionResult> {
  return deleteItem(projectId, slug, projectMapService.deleteFlow, "Failed to delete flow.");
}

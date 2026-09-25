"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getCurrentUser } from "@/features/auth/server";
import { projectSchema } from "./schemas/project";
import {
  ticketCommentSchema,
  ticketCreateSchema,
  ticketInputSchema,
  ticketTimeAdjustSchema,
} from "./schemas/ticket";
import { devBoardService } from "./services/dev-board-service";
import { projectsService } from "./services/projects-service";
import type { TimeEntry } from "./types/analytics";
import type { Ticket, TicketComment } from "./types/board";
import type { Project } from "./types/project";

export type DevBoardActionResult<T = void> = { ok: true; data: T } | { ok: false; message: string };

function failure(error: unknown, fallback: string): DevBoardActionResult<never> {
  if (error instanceof Error && error.message) return { ok: false, message: error.message };
  return { ok: false, message: fallback };
}

async function isAuthenticated(): Promise<boolean> {
  return (await getCurrentUser()) !== null;
}

export async function createProjectAction(input: unknown): Promise<DevBoardActionResult<Project>> {
  if (!(await isAuthenticated())) {
    return { ok: false, message: "You must be signed in to create projects." };
  }

  const parsed = projectSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid project." };
  }

  try {
    const project = await projectsService.createProject(parsed.data);
    revalidatePath("/dev-board", "layout");
    return { ok: true, data: project };
  } catch (error) {
    return failure(error, "Failed to create project.");
  }
}

export async function updateProjectAction(
  projectId: unknown,
  input: unknown,
): Promise<DevBoardActionResult<Project>> {
  if (!(await isAuthenticated())) {
    return { ok: false, message: "You must be signed in to update projects." };
  }

  const parsedId = z.uuid().safeParse(projectId);
  if (!parsedId.success) {
    return { ok: false, message: "Invalid project." };
  }

  const parsed = projectSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid project." };
  }

  try {
    const project = await projectsService.updateProject(parsedId.data, parsed.data);
    revalidatePath("/dev-board", "layout");
    return { ok: true, data: project };
  } catch (error) {
    return failure(error, "Failed to update project.");
  }
}

export async function deleteProjectAction(projectId: unknown): Promise<DevBoardActionResult> {
  if (!(await isAuthenticated())) {
    return { ok: false, message: "You must be signed in to delete projects." };
  }

  const parsedId = z.uuid().safeParse(projectId);
  if (!parsedId.success) {
    return { ok: false, message: "Invalid project." };
  }

  try {
    await projectsService.deleteProject(parsedId.data);
    revalidatePath("/dev-board", "layout");
    return { ok: true, data: undefined };
  } catch (error) {
    return failure(error, "Failed to delete project.");
  }
}

export async function createTicketAction(input: unknown): Promise<DevBoardActionResult<Ticket>> {
  if (!(await isAuthenticated())) {
    return { ok: false, message: "You must be signed in to create tickets." };
  }

  const parsed = ticketCreateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid ticket." };
  }

  try {
    const ticket = await devBoardService.createTicket(parsed.data);
    return { ok: true, data: ticket };
  } catch (error) {
    return failure(error, "Failed to create ticket.");
  }
}

export async function getTicketAction(ticketId: unknown): Promise<DevBoardActionResult<Ticket>> {
  if (!(await isAuthenticated())) {
    return { ok: false, message: "You must be signed in to view tickets." };
  }

  const parsedId = z.uuid().safeParse(ticketId);
  if (!parsedId.success) {
    return { ok: false, message: "Invalid ticket." };
  }

  try {
    const ticket = await devBoardService.getTicket(parsedId.data);
    if (!ticket) return { ok: false, message: "Ticket not found." };
    return { ok: true, data: ticket };
  } catch (error) {
    return failure(error, "Failed to load ticket.");
  }
}

export async function updateTicketAction(input: unknown): Promise<DevBoardActionResult<Ticket>> {
  if (!(await isAuthenticated())) {
    return { ok: false, message: "You must be signed in to update tickets." };
  }

  const parsed = ticketInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid ticket." };
  }

  try {
    const ticket = await devBoardService.updateTicket(parsed.data);
    return { ok: true, data: ticket };
  } catch (error) {
    return failure(error, "Failed to update ticket.");
  }
}

export async function adjustTicketTimeAction(
  input: unknown,
): Promise<DevBoardActionResult<Ticket>> {
  if (!(await isAuthenticated())) {
    return { ok: false, message: "You must be signed in to adjust ticket time." };
  }

  const parsed = ticketTimeAdjustSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid adjustment." };
  }

  try {
    const ticket = await devBoardService.adjustTicketTime(parsed.data);
    return { ok: true, data: ticket };
  } catch (error) {
    return failure(error, "Failed to adjust ticket time.");
  }
}

export async function getLastTimeEntryAction(
  ticketId: unknown,
): Promise<DevBoardActionResult<TimeEntry | null>> {
  if (!(await isAuthenticated())) {
    return { ok: false, message: "You must be signed in to load ticket time." };
  }

  const parsedId = z.uuid().safeParse(ticketId);
  if (!parsedId.success) {
    return { ok: false, message: "Invalid ticket." };
  }

  try {
    const entry = await devBoardService.lastTimeEntry(parsedId.data);
    return { ok: true, data: entry };
  } catch (error) {
    return failure(error, "Failed to load ticket time.");
  }
}

export async function deleteTicketAction(ticketId: unknown): Promise<DevBoardActionResult> {
  if (!(await isAuthenticated())) {
    return { ok: false, message: "You must be signed in to delete tickets." };
  }

  const parsedId = z.uuid().safeParse(ticketId);
  if (!parsedId.success) {
    return { ok: false, message: "Invalid ticket." };
  }

  try {
    await devBoardService.deleteTicket(parsedId.data);
    return { ok: true, data: undefined };
  } catch (error) {
    return failure(error, "Failed to delete ticket.");
  }
}

export async function createTicketCommentAction(
  ticketId: unknown,
  body: unknown,
): Promise<DevBoardActionResult<TicketComment>> {
  if (!(await isAuthenticated())) {
    return { ok: false, message: "You must be signed in to comment." };
  }

  const parsedId = z.uuid().safeParse(ticketId);
  if (!parsedId.success) {
    return { ok: false, message: "Invalid ticket." };
  }

  const parsed = ticketCommentSchema.safeParse({ body });
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid comment." };
  }

  try {
    const comment = await devBoardService.createComment(parsedId.data, parsed.data.body);
    return { ok: true, data: comment };
  } catch (error) {
    return failure(error, "Failed to create comment.");
  }
}

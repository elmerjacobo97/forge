"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getCurrentUser } from "@/features/auth/server";
import { meetingActionItemSchema, meetingSchema } from "./schemas/meeting";
import { meetingsService } from "./services/meetings-service";
import type { Meeting, MeetingActionItem } from "./types";
import type { Ticket } from "@/features/dev-board/types/board";

export type MeetingActionResult<T = void> = { ok: true; data: T } | { ok: false; message: string };

const meetingIdSchema = z.uuid();
const completionSchema = z.boolean();

function failure(error: unknown, fallback: string): MeetingActionResult<never> {
  if (error instanceof Error && error.message) return { ok: false, message: error.message };
  return { ok: false, message: fallback };
}

async function isAuthenticated(): Promise<boolean> {
  return (await getCurrentUser()) !== null;
}

function revalidateMeetings(): void {
  revalidatePath("/meetings");
  revalidatePath("/meetings/[meetingId]", "page");
}

export async function createMeetingAction(input: unknown): Promise<MeetingActionResult<Meeting>> {
  if (!(await isAuthenticated())) {
    return { ok: false, message: "You must be signed in to manage meetings." };
  }
  const parsed = meetingSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid meeting." };
  }

  try {
    const meeting = await meetingsService.createMeeting(parsed.data);
    revalidateMeetings();
    return { ok: true, data: meeting };
  } catch (error) {
    return failure(error, "Failed to create meeting.");
  }
}

export async function updateMeetingAction(
  meetingId: unknown,
  input: unknown,
): Promise<MeetingActionResult<Meeting>> {
  if (!(await isAuthenticated())) {
    return { ok: false, message: "You must be signed in to manage meetings." };
  }
  const parsedId = meetingIdSchema.safeParse(meetingId);
  if (!parsedId.success) return { ok: false, message: "Invalid meeting." };
  const parsed = meetingSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid meeting." };
  }

  try {
    const meeting = await meetingsService.updateMeeting(parsedId.data, parsed.data);
    revalidateMeetings();
    return { ok: true, data: meeting };
  } catch (error) {
    return failure(error, "Failed to update meeting.");
  }
}

export async function deleteMeetingAction(meetingId: unknown): Promise<MeetingActionResult> {
  if (!(await isAuthenticated())) {
    return { ok: false, message: "You must be signed in to manage meetings." };
  }
  const parsedId = meetingIdSchema.safeParse(meetingId);
  if (!parsedId.success) return { ok: false, message: "Invalid meeting." };

  try {
    await meetingsService.deleteMeeting(parsedId.data);
    revalidateMeetings();
    return { ok: true, data: undefined };
  } catch (error) {
    return failure(error, "Failed to delete meeting.");
  }
}

export async function createMeetingActionItemAction(
  meetingId: unknown,
  input: unknown,
): Promise<MeetingActionResult<MeetingActionItem>> {
  if (!(await isAuthenticated())) {
    return { ok: false, message: "You must be signed in to manage meetings." };
  }
  const parsedMeetingId = meetingIdSchema.safeParse(meetingId);
  if (!parsedMeetingId.success) return { ok: false, message: "Invalid meeting." };
  const parsed = meetingActionItemSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid action item." };
  }

  try {
    const actionItem = await meetingsService.createActionItem(parsedMeetingId.data, parsed.data);
    revalidateMeetings();
    return { ok: true, data: actionItem };
  } catch (error) {
    return failure(error, "Failed to create action item.");
  }
}

export async function updateMeetingActionItemAction(
  actionItemId: unknown,
  input: unknown,
): Promise<MeetingActionResult<MeetingActionItem>> {
  if (!(await isAuthenticated())) {
    return { ok: false, message: "You must be signed in to manage meetings." };
  }
  const parsedId = meetingIdSchema.safeParse(actionItemId);
  if (!parsedId.success) return { ok: false, message: "Invalid action item." };
  const parsed = meetingActionItemSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid action item." };
  }

  try {
    const actionItem = await meetingsService.updateActionItem(parsedId.data, parsed.data);
    revalidateMeetings();
    return { ok: true, data: actionItem };
  } catch (error) {
    return failure(error, "Failed to update action item.");
  }
}

export async function setMeetingActionItemCompletedAction(
  actionItemId: unknown,
  isCompleted: unknown,
): Promise<MeetingActionResult<MeetingActionItem>> {
  if (!(await isAuthenticated())) {
    return { ok: false, message: "You must be signed in to manage meetings." };
  }
  const parsedId = meetingIdSchema.safeParse(actionItemId);
  if (!parsedId.success) return { ok: false, message: "Invalid action item." };
  const parsedCompletion = completionSchema.safeParse(isCompleted);
  if (!parsedCompletion.success) return { ok: false, message: "Invalid completion state." };

  try {
    const actionItem = await meetingsService.setActionItemCompleted(
      parsedId.data,
      parsedCompletion.data,
    );
    revalidateMeetings();
    return { ok: true, data: actionItem };
  } catch (error) {
    return failure(error, "Failed to update action item.");
  }
}

export async function deleteMeetingActionItemAction(
  actionItemId: unknown,
): Promise<MeetingActionResult> {
  if (!(await isAuthenticated())) {
    return { ok: false, message: "You must be signed in to manage meetings." };
  }
  const parsedId = meetingIdSchema.safeParse(actionItemId);
  if (!parsedId.success) return { ok: false, message: "Invalid action item." };

  try {
    await meetingsService.deleteActionItem(parsedId.data);
    revalidateMeetings();
    return { ok: true, data: undefined };
  } catch (error) {
    return failure(error, "Failed to delete action item.");
  }
}

export async function createTicketFromMeetingActionItemAction(
  actionItemId: unknown,
  projectId?: unknown,
): Promise<MeetingActionResult<Ticket>> {
  if (!(await isAuthenticated())) {
    return { ok: false, message: "You must be signed in to manage meetings." };
  }
  const parsedActionItemId = meetingIdSchema.safeParse(actionItemId);
  if (!parsedActionItemId.success) return { ok: false, message: "Invalid action item." };
  const parsedProjectId =
    projectId === undefined || projectId === null
      ? { success: true as const, data: null }
      : z.uuid().safeParse(projectId);
  if (!parsedProjectId.success) return { ok: false, message: "Invalid project." };

  try {
    const ticket = await meetingsService.createTicketFromActionItem(
      parsedActionItemId.data,
      parsedProjectId.data,
    );
    revalidateMeetings();
    revalidatePath("/dev-board", "layout");
    revalidatePath(`/dev-board/${ticket.projectId}`);
    return { ok: true, data: ticket };
  } catch (error) {
    return failure(error, "Failed to create ticket from action item.");
  }
}

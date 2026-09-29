"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getCurrentUser } from "@/features/auth/server";
import { meetingSchema } from "./schemas/meeting";
import { meetingsService } from "./services/meetings-service";
import type { Meeting } from "./types";

export type MeetingActionResult<T = void> = { ok: true; data: T } | { ok: false; message: string };

const meetingIdSchema = z.uuid();
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

"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getCurrentUser } from "@/features/auth/server";
import { noteInputSchema } from "./schemas/note-schema";
import { notesService } from "./services/notes-service";

export type NoteActionResult = { ok: true } | { ok: false; message: string };

const noteIdSchema = z.uuid();

function failure(error: unknown, fallback: string): NoteActionResult {
  if (error instanceof Error && error.message) return { ok: false, message: error.message };
  return { ok: false, message: fallback };
}

async function isAuthenticated(): Promise<boolean> {
  return (await getCurrentUser()) !== null;
}

export async function createNoteAction(input: unknown): Promise<NoteActionResult> {
  if (!(await isAuthenticated())) {
    return { ok: false, message: "Sign in to use Notes." };
  }

  const parsed = noteInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  try {
    await notesService.createNote(parsed.data);
    revalidatePath("/notes");
    return { ok: true };
  } catch (error) {
    return failure(error, "Failed to create note.");
  }
}

export async function updateNoteAction(noteId: unknown, input: unknown): Promise<NoteActionResult> {
  if (!(await isAuthenticated())) {
    return { ok: false, message: "Sign in to use Notes." };
  }

  const parsedId = noteIdSchema.safeParse(noteId);
  if (!parsedId.success) {
    return { ok: false, message: "Invalid note id." };
  }

  const parsed = noteInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  try {
    await notesService.updateNote(parsedId.data, parsed.data);
    revalidatePath("/notes");
    return { ok: true };
  } catch (error) {
    return failure(error, "Failed to update note.");
  }
}

export async function deleteNoteAction(noteId: unknown): Promise<NoteActionResult> {
  if (!(await isAuthenticated())) {
    return { ok: false, message: "Sign in to use Notes." };
  }

  const parsedId = noteIdSchema.safeParse(noteId);
  if (!parsedId.success) {
    return { ok: false, message: "Invalid note id." };
  }

  try {
    await notesService.deleteNote(parsedId.data);
    revalidatePath("/notes");
    return { ok: true };
  } catch (error) {
    return failure(error, "Failed to delete note.");
  }
}

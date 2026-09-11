"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getCurrentUser } from "@/features/auth/server";
import { bookmarkInputSchema } from "./schemas/bookmarks-schema";
import { bookmarksService } from "./services/bookmarks-service";

export type BookmarkActionResult = { ok: true } | { ok: false; message: string };

const bookmarkIdSchema = z.uuid();

function failure(error: unknown, fallback: string): BookmarkActionResult {
  if (error instanceof Error && error.message) return { ok: false, message: error.message };
  return { ok: false, message: fallback };
}

async function isAuthenticated(): Promise<boolean> {
  return (await getCurrentUser()) !== null;
}

export async function createBookmarkAction(input: unknown): Promise<BookmarkActionResult> {
  if (!(await isAuthenticated())) {
    return { ok: false, message: "Sign in to use Bookmarks." };
  }

  const parsed = bookmarkInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  try {
    await bookmarksService.createBookmark(parsed.data);
    revalidatePath("/bookmarks");
    return { ok: true };
  } catch (error) {
    return failure(error, "Failed to create bookmark.");
  }
}

export async function updateBookmarkAction(
  bookmarkId: unknown,
  input: unknown,
): Promise<BookmarkActionResult> {
  if (!(await isAuthenticated())) {
    return { ok: false, message: "Sign in to use Bookmarks." };
  }

  const parsedId = bookmarkIdSchema.safeParse(bookmarkId);
  if (!parsedId.success) {
    return { ok: false, message: "Invalid bookmark id." };
  }

  const parsed = bookmarkInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  try {
    await bookmarksService.updateBookmark(parsedId.data, parsed.data);
    revalidatePath("/bookmarks");
    return { ok: true };
  } catch (error) {
    return failure(error, "Failed to update bookmark.");
  }
}

export async function deleteBookmarkAction(bookmarkId: unknown): Promise<BookmarkActionResult> {
  if (!(await isAuthenticated())) {
    return { ok: false, message: "Sign in to use Bookmarks." };
  }

  const parsedId = bookmarkIdSchema.safeParse(bookmarkId);
  if (!parsedId.success) {
    return { ok: false, message: "Invalid bookmark id." };
  }

  try {
    await bookmarksService.deleteBookmark(parsedId.data);
    revalidatePath("/bookmarks");
    return { ok: true };
  } catch (error) {
    return failure(error, "Failed to delete bookmark.");
  }
}

import { z } from "zod";

import { insforge } from "@/lib/insforge/browser";
import type { Bookmark } from "../types";

const bookmarkRowSchema = z.object({
  id: z.string(),
  title: z.string(),
  url: z.string(),
  category: z.enum(["docs", "git", "tool", "article", "other"]),
  description: z.string(),
  tags: z.array(z.string()),
  created_at: z.string(),
});

type BookmarkInput = Omit<Bookmark, "id" | "createdAt">;

function requireUser(userId?: string): void {
  if (!userId) throw new Error("Sign in to use Bookmarks.");
}

function toBookmark(value: unknown): Bookmark {
  const row = bookmarkRowSchema.parse(value);
  return { ...row, createdAt: row.created_at };
}

function failure(error: { message?: string } | null, fallback: string): Error {
  return new Error(error?.message || fallback);
}

export const bookmarksService = {
  async fetchBookmarks(userId?: string): Promise<Bookmark[]> {
    requireUser(userId);
    const { data, error } = await insforge.database
      .from("bookmarks")
      .select("id,title,url,category,description,tags,created_at")
      .order("created_at", { ascending: false });
    if (error) throw failure(error, "Failed to load bookmarks.");
    return bookmarkRowSchema.array().parse(data).map(toBookmark);
  },

  async createBookmark(bookmark: BookmarkInput, userId?: string): Promise<Bookmark> {
    requireUser(userId);
    const { data, error } = await insforge.database
      .from("bookmarks")
      .insert([bookmark])
      .select("id,title,url,category,description,tags,created_at")
      .single();
    if (error) throw failure(error, "Failed to create bookmark.");
    return toBookmark(data);
  },

  async updateBookmark(
    bookmarkId: string,
    bookmark: BookmarkInput,
    userId?: string,
  ): Promise<Bookmark> {
    requireUser(userId);
    const { data, error } = await insforge.database
      .from("bookmarks")
      .update(bookmark)
      .eq("id", bookmarkId)
      .select("id,title,url,category,description,tags,created_at")
      .single();
    if (error) throw failure(error, "Failed to update bookmark.");
    return toBookmark(data);
  },

  async deleteBookmark(bookmarkId: string, userId?: string): Promise<void> {
    requireUser(userId);
    const { error } = await insforge.database.from("bookmarks").delete().eq("id", bookmarkId);
    if (error) throw failure(error, "Failed to delete bookmark.");
  },
};

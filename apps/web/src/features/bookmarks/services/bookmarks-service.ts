import "server-only";

import { z } from "zod";

import { createInsForgeServerClient } from "@/lib/insforge/server";
import type { BookmarkFilters } from "../schemas/bookmarks-schema";
import type { Bookmark } from "../types";
import { filterBookmarks } from "../utils/filters";

const bookmarkRowSchema = z.object({
  id: z.string(),
  title: z.string(),
  url: z.string(),
  category: z.enum(["docs", "git", "tool", "article", "other"]),
  description: z.string(),
  tags: z.array(z.string()),
  created_at: z.string(),
});

export type BookmarkInput = Omit<Bookmark, "id" | "createdAt">;

function toBookmark(value: unknown): Bookmark {
  const row = bookmarkRowSchema.parse(value);
  return { ...row, createdAt: row.created_at };
}

function failure(error: { message?: string } | null, fallback: string): Error {
  return new Error(error?.message || fallback);
}

export const bookmarksService = {
  async fetchBookmarks(filters?: BookmarkFilters): Promise<Bookmark[]> {
    const insforge = await createInsForgeServerClient();
    const { data, error } = await insforge.database
      .from("bookmarks")
      .select("id,title,url,category,description,tags,created_at")
      .order("created_at", { ascending: false });
    if (error) throw failure(error, "Failed to load bookmarks.");

    const bookmarks = bookmarkRowSchema.array().parse(data).map(toBookmark);
    return filters ? filterBookmarks(bookmarks, filters) : bookmarks;
  },

  async createBookmark(bookmark: BookmarkInput): Promise<Bookmark> {
    const insforge = await createInsForgeServerClient();
    const { data, error } = await insforge.database
      .from("bookmarks")
      .insert([bookmark])
      .select("id,title,url,category,description,tags,created_at")
      .single();
    if (error) throw failure(error, "Failed to create bookmark.");
    return toBookmark(data);
  },

  async updateBookmark(bookmarkId: string, bookmark: BookmarkInput): Promise<Bookmark> {
    const insforge = await createInsForgeServerClient();
    const { data, error } = await insforge.database
      .from("bookmarks")
      .update(bookmark)
      .eq("id", bookmarkId)
      .select("id,title,url,category,description,tags,created_at")
      .single();
    if (error) throw failure(error, "Failed to update bookmark.");
    return toBookmark(data);
  },

  async deleteBookmark(bookmarkId: string): Promise<void> {
    const insforge = await createInsForgeServerClient();
    const { error } = await insforge.database.from("bookmarks").delete().eq("id", bookmarkId);
    if (error) throw failure(error, "Failed to delete bookmark.");
  },
};

import type { Bookmark } from "../types";
import type { BookmarkFilters } from "../schemas/bookmarks-schema";

export function filterBookmarks(bookmarks: Bookmark[], filters: BookmarkFilters): Bookmark[] {
  const query = filters.q.trim().toLowerCase();

  return bookmarks.filter((bookmark) => {
    const matchesSearch = !query || bookmark.title.toLowerCase().includes(query);
    const matchesCategory = filters.category === "all" || bookmark.category === filters.category;
    return matchesSearch && matchesCategory;
  });
}

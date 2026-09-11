import { Globe } from "lucide-react";

import { BookmarkCard } from "./components/bookmark-card";
import { BookmarksToolbar } from "./components/bookmarks-toolbar";
import type { BookmarkFilters } from "./schemas/bookmarks-schema";
import type { Bookmark } from "./types";

export function Bookmarks({
  bookmarks,
  filters,
}: {
  bookmarks: Bookmark[];
  filters: BookmarkFilters;
}) {
  return (
    <div className="flex h-full flex-col gap-4">
      <BookmarksToolbar filters={filters} />

      <div className="min-h-0 flex-1 overflow-y-auto">
        {bookmarks.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
            <Globe className="size-8 text-muted-foreground/40" />
            <p className="text-sm font-medium">No bookmarks found</p>
            <p className="text-xs text-muted-foreground">
              Refine your search or add a new bookmark.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {bookmarks.map((bookmark) => (
              <BookmarkCard
                key={bookmark.id}
                bookmark={bookmark}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

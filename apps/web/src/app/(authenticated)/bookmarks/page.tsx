import { Bookmarks } from "@/features/bookmarks/bookmarks";
import { parseBookmarkFilters } from "@/features/bookmarks/schemas/bookmarks-schema";
import { bookmarksService } from "@/features/bookmarks/services/bookmarks-service";

export default async function BookmarksPage({ searchParams }: PageProps<"/bookmarks">) {
  const filters = parseBookmarkFilters(await searchParams);
  const bookmarks = await bookmarksService.fetchBookmarks(filters);

  return (
    <Bookmarks
      bookmarks={bookmarks}
      filters={filters}
    />
  );
}

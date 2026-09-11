import { Bookmarks } from "@/features/bookmarks/bookmarks";
import { parseBookmarkFilters } from "@/features/bookmarks/schemas/bookmarks-schema";
import { bookmarksService } from "@/features/bookmarks/services/bookmarks-service";
import { parseVisibleParam } from "@/lib/pagination";

export default async function BookmarksPage({ searchParams }: PageProps<"/bookmarks">) {
  const params = await searchParams;
  const filters = parseBookmarkFilters(params);
  const visible = parseVisibleParam(params.visible);
  const { bookmarks, total } = await bookmarksService.fetchBookmarks(filters, visible);

  return (
    <Bookmarks
      bookmarks={bookmarks}
      filters={filters}
      total={total}
    />
  );
}

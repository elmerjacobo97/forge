import { useQuery } from "@tanstack/react-query";
import { useUserQuery } from "@/features/auth/hooks/queries";
import { bookmarksService } from "../services/bookmarks-service";

export function useBookmarksQuery() {
  const { data: user } = useUserQuery();
  const userId = user?.id;

  return useQuery({
    queryKey: ["bookmarks", userId],
    queryFn: () => bookmarksService.fetchBookmarks(userId),
    enabled: Boolean(userId),
  });
}

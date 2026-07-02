import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useUserQuery } from "@/features/auth/hooks/queries";
import { bookmarksService } from "../services/bookmarks-service";
import type { DevLink } from "../types";
import { toast } from "sonner";

export function useCreateBookmarkMutation() {
  const queryClient = useQueryClient();
  const { data: user } = useUserQuery();
  const userId = user?.id;

  return useMutation({
    mutationFn: (bookmark: Omit<DevLink, "id" | "createdAt">) =>
      bookmarksService.createBookmark(bookmark, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookmarks", userId] });
      toast.success("Bookmark added successfully!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to add bookmark.");
    },
  });
}

export function useDeleteBookmarkMutation() {
  const queryClient = useQueryClient();
  const { data: user } = useUserQuery();
  const userId = user?.id;

  return useMutation({
    mutationFn: (bookmarkId: string) =>
      bookmarksService.deleteBookmark(bookmarkId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookmarks", userId] });
      toast.success("Bookmark deleted successfully!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete bookmark.");
    },
  });
}

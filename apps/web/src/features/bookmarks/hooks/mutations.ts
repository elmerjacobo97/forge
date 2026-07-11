import { useMutation, useQueryClient } from "@tanstack/react-query";
import { userQueryOptions } from "@/features/auth/hooks/queries";
import type { AuthUser } from "@/features/auth/types";
import { bookmarksService } from "../services/bookmarks-service";
import type { Bookmark } from "../types";
import { toast } from "sonner";

export function useCreateBookmarkMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (bookmark: Omit<Bookmark, "id" | "createdAt">) => {
      // Read userId synchronously from cache — no re-render subscription needed
      const userId = queryClient.getQueryData<AuthUser>(userQueryOptions.queryKey)?.id;
      return bookmarksService.createBookmark(bookmark, userId);
    },
    onSuccess: () => {
      const userId = queryClient.getQueryData<AuthUser>(userQueryOptions.queryKey)?.id;
      queryClient.invalidateQueries({ queryKey: ["bookmarks", userId] });
      toast.success("Bookmark added successfully!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to add bookmark.");
    },
  });
}

export function useDeleteBookmarkMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (bookmarkId: string) => {
      const userId = queryClient.getQueryData<AuthUser>(userQueryOptions.queryKey)?.id;
      return bookmarksService.deleteBookmark(bookmarkId, userId);
    },
    onSuccess: () => {
      const userId = queryClient.getQueryData<AuthUser>(userQueryOptions.queryKey)?.id;
      queryClient.invalidateQueries({ queryKey: ["bookmarks", userId] });
      toast.success("Bookmark deleted successfully!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete bookmark.");
    },
  });
}

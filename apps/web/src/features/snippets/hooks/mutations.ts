import { useMutation, useQueryClient } from "@tanstack/react-query";
import { userQueryOptions } from "@/features/auth/hooks/queries";
import type { AuthUser } from "@/features/auth/types";
import { snippetsService } from "../services/snippets-service";
import type { Snippet } from "../types";
import { toast } from "sonner";

export function useCreateSnippetMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (snippet: Omit<Snippet, "id" | "createdAt">) => {
      const userId = queryClient.getQueryData<AuthUser>(userQueryOptions.queryKey)?.id;
      return snippetsService.createSnippet(snippet, userId);
    },
    onSuccess: () => {
      const userId = queryClient.getQueryData<AuthUser>(userQueryOptions.queryKey)?.id;
      queryClient.invalidateQueries({ queryKey: ["snippets", userId] });
      toast.success("Resource added successfully!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to add resource.");
    },
  });
}

export function useUpdateSnippetMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...snippet }: { id: string } & Omit<Snippet, "id" | "createdAt">) => {
      const userId = queryClient.getQueryData<AuthUser>(userQueryOptions.queryKey)?.id;
      return snippetsService.updateSnippet(id, snippet, userId);
    },
    onSuccess: () => {
      const userId = queryClient.getQueryData<AuthUser>(userQueryOptions.queryKey)?.id;
      queryClient.invalidateQueries({ queryKey: ["snippets", userId] });
      toast.success("Resource updated successfully!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update resource.");
    },
  });
}

export function useDeleteSnippetMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (snippetId: string) => {
      const userId = queryClient.getQueryData<AuthUser>(userQueryOptions.queryKey)?.id;
      return snippetsService.deleteSnippet(snippetId, userId);
    },
    onSuccess: () => {
      const userId = queryClient.getQueryData<AuthUser>(userQueryOptions.queryKey)?.id;
      queryClient.invalidateQueries({ queryKey: ["snippets", userId] });
      toast.success("Resource deleted successfully!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete resource.");
    },
  });
}

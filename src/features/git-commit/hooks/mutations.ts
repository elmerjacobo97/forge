import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { reposService } from "../services/repos-service";
import { SAVED_REPOS_QUERY_KEY } from "./queries";

export function useAddRepoMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (path: string) => {
      const repos = await reposService.add(path);
      return repos.find((r) => r.path === path)!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SAVED_REPOS_QUERY_KEY });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to add repository.");
    },
  });
}

export function useRemoveRepoMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => reposService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SAVED_REPOS_QUERY_KEY });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to remove repository.");
    },
  });
}

export function useTouchRepoMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => reposService.touch(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SAVED_REPOS_QUERY_KEY });
    },
  });
}

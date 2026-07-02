import { useQuery } from "@tanstack/react-query";
import { reposService } from "../services/repos-service";

export const SAVED_REPOS_QUERY_KEY = ["saved-repos"];

export function useSavedReposQuery() {
  return useQuery({
    queryKey: SAVED_REPOS_QUERY_KEY,
    queryFn: reposService.list,
  });
}

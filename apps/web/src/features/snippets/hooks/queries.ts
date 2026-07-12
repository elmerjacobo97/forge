import { useQuery } from "@tanstack/react-query";
import { useUserQuery } from "@/features/auth/hooks/queries";
import { snippetsService } from "../services/snippets-service";

export function useSnippetsQuery() {
  const { data: user } = useUserQuery();
  const userId = user?.id;

  return useQuery({
    queryKey: ["snippets", userId],
    queryFn: () => snippetsService.fetchSnippets(userId),
    enabled: Boolean(userId),
  });
}

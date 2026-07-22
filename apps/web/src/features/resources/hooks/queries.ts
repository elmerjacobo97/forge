import { useQuery } from "@tanstack/react-query";
import { useUserQuery } from "@/features/auth/hooks/queries";
import { resourcesService } from "../services/resources-service";

export function useResourcesQuery() {
  const { data: user } = useUserQuery();
  const userId = user?.id;

  return useQuery({
    queryKey: ["resources", userId],
    queryFn: () => resourcesService.fetchResources(userId),
    enabled: Boolean(userId),
  });
}

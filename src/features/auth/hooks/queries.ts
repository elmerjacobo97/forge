import { queryOptions, useQuery } from "@tanstack/react-query";
import { account } from "@/lib/appwrite";
import { AuthUser } from "../types";

export const userQueryOptions = queryOptions({
  queryKey: ["session"],
  queryFn: async (): Promise<AuthUser> => {
    const user = await account.get();
    return {
      id: user.$id,
      name: user.name,
      email: user.email,
    };
  },
  retry: false,
  staleTime: 1000 * 60 * 10, // 10 minutes cache
});

export function useUserQuery() {
  return useQuery(userQueryOptions);
}

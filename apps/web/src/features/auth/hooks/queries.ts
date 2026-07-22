import { useAuthUser } from "@/features/auth/components/auth-user-provider";

export const userQueryOptions = { queryKey: ["session"] as const };

export function useUserQuery() {
  return { data: useAuthUser() };
}

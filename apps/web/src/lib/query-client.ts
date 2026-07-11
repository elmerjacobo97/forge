import { QueryClient } from "@tanstack/react-query";

// Desktop app: no focus-refetch (no browser tab focus model). Modest stale time
// keeps things fresh without hammering a future backend on every view change.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});
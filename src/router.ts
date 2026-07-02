import {
  createBrowserHistory,
  createRouter,
} from "@tanstack/react-router";

import { queryClient } from "@/lib/query-client";
import { routeTree } from "./routeTree.gen";

// Browser history: Template code
const history = createBrowserHistory({});

export const router = createRouter({
  routeTree,
  history,
  context: {
    queryClient,
  },
  defaultPreload: "intent",
  scrollRestoration: true,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
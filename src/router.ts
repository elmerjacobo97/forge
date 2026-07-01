import {
  createBrowserHistory,
  createRouter,
} from "@tanstack/react-router";

import { authState } from "@/lib/auth";
import { queryClient } from "@/lib/query-client";
import { routeTree } from "./routeTree.gen";

// Browser history: Tauri webview has no address bar, so URLs are invisible to
// the user, but they enable back/forward, deep-linking (forge:// scheme), and
// "last opened tool" persistence. Switching to memory history is a one-liner
// if ever needed for constrained environments.
const history = createBrowserHistory({});

export const router = createRouter({
  routeTree,
  history,
  context: {
    auth: authState,
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
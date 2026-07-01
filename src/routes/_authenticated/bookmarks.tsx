import { createFileRoute } from "@tanstack/react-router";

import { Bookmarks } from "@/features/bookmarks/bookmarks.tsx";

export const Route = createFileRoute("/_authenticated/bookmarks")({
  component: Bookmarks,
});

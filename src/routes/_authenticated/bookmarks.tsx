import { createFileRoute } from "@tanstack/react-router";

import { Bookmarks } from "@/features/bookmarks/components/bookmarks";

export const Route = createFileRoute("/_authenticated/bookmarks")({
  component: Bookmarks,
});

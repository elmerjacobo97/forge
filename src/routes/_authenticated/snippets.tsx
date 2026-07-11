import { createFileRoute } from "@tanstack/react-router";
import { Snippets } from "@/features/snippets/snippets.tsx";

export const Route = createFileRoute("/_authenticated/snippets")({
  component: Snippets,
});

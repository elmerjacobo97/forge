import { createFileRoute } from "@tanstack/react-router";

import { HtmlEntities } from "@/features/html-entities/html-entities.tsx";

export const Route = createFileRoute("/_authenticated/html-entities")({
  component: HtmlEntities,
});

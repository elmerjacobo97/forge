import { createFileRoute } from "@tanstack/react-router";

import { JsonFormatter } from "@/features/json-formatter/json-formatter.tsx";

export const Route = createFileRoute("/_authenticated/json-formatter")({
  component: JsonFormatter,
});

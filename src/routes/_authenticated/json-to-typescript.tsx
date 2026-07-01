import { createFileRoute } from "@tanstack/react-router";

import { JsonToTypescript } from "@/features/json-to-typescript/json-to-typescript.tsx";

export const Route = createFileRoute("/_authenticated/json-to-typescript")({
  component: JsonToTypescript,
});

import { createFileRoute } from "@tanstack/react-router";

import { HashGenerator } from "@/features/hash-generator/hash-generator.tsx";

export const Route = createFileRoute("/_authenticated/hash-generator")({
  component: HashGenerator,
});

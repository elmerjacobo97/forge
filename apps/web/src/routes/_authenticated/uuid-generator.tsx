import { createFileRoute } from "@tanstack/react-router";

import { UuidGenerator } from "@/features/uuid-generator/uuid-generator.tsx";

export const Route = createFileRoute("/_authenticated/uuid-generator")({
  component: UuidGenerator,
});

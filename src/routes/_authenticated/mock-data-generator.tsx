import { createFileRoute } from "@tanstack/react-router";

import { MockDataGenerator } from "@/features/mock-data-generator/mock-data-generator";

export const Route = createFileRoute("/_authenticated/mock-data-generator")({
  component: MockDataGenerator,
});

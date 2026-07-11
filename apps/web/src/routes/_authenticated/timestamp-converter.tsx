import { createFileRoute } from "@tanstack/react-router";

import { TimestampConverter } from "@/features/timestamp-converter/timestamp-converter.tsx";

export const Route = createFileRoute("/_authenticated/timestamp-converter")({
  component: TimestampConverter,
});

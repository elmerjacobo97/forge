import { createFileRoute } from "@tanstack/react-router";

import { FormatConverter } from "@/features/format-converter/format-converter.tsx";

export const Route = createFileRoute("/_authenticated/format-converter")({
  component: FormatConverter,
});

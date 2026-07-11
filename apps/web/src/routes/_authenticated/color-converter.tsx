import { createFileRoute } from "@tanstack/react-router";

import { ColorConverter } from "@/features/color-converter/color-converter.tsx";

export const Route = createFileRoute("/_authenticated/color-converter")({
  component: ColorConverter,
});

import { createFileRoute } from "@tanstack/react-router";

import { ImageTools } from "@/features/image-tools/image-tools.tsx";

export const Route = createFileRoute("/_authenticated/image-tools")({
  component: ImageTools,
});

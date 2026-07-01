import { createFileRoute } from "@tanstack/react-router";

import { Base64Tool } from "@/features/base64/base64.tsx";

export const Route = createFileRoute("/_authenticated/base64")({
  component: Base64Tool,
});

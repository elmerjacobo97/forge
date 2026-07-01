import { createFileRoute } from "@tanstack/react-router";

import { QrGenerator } from "@/features/qr-generator/qr-generator.tsx";

export const Route = createFileRoute("/_authenticated/qr-generator")({
  component: QrGenerator,
});

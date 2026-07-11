import { createFileRoute } from "@tanstack/react-router";

import { JwtDecoder } from "@/features/jwt-decoder/jwt-decoder.tsx";

export const Route = createFileRoute("/_authenticated/jwt-decoder")({
  component: JwtDecoder,
});

import { createFileRoute } from "@tanstack/react-router";

import { UrlEncoder } from "@/features/url-encoder/url-encoder.tsx";

export const Route = createFileRoute("/_authenticated/url-encoder")({
  component: UrlEncoder,
});

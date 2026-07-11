import { createFileRoute } from "@tanstack/react-router";

import { LoremIpsum } from "@/features/lorem-ipsum/lorem-ipsum.tsx";

export const Route = createFileRoute("/_authenticated/lorem-ipsum")({
  component: LoremIpsum,
});

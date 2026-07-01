import { createFileRoute } from "@tanstack/react-router";

import { TextManipulator } from "@/features/text-manipulator/text-manipulator.tsx";

export const Route = createFileRoute("/_authenticated/text-manipulator")({
  component: TextManipulator,
});

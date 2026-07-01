import { createFileRoute } from "@tanstack/react-router";

import { FileValidator } from "@/features/file-validator/file-validator.tsx";

export const Route = createFileRoute("/_authenticated/file-validator")({
  component: FileValidator,
});

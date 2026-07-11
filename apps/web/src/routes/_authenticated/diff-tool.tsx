import { createFileRoute } from "@tanstack/react-router";

import { DiffTool } from "@/features/diff-tool/diff-tool.tsx";

export const Route = createFileRoute("/_authenticated/diff-tool")({
  component: DiffTool,
});

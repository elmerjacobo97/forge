import { createFileRoute } from "@tanstack/react-router";

import { DevBoard } from "@/features/dev-board/dev-board.tsx";

export const Route = createFileRoute("/_authenticated/dev-board")({
  component: DevBoard,
});

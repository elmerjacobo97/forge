import { createFileRoute } from "@tanstack/react-router";
import { GitCommit } from "@/features/git-commit/git-commit";

export const Route = createFileRoute("/_authenticated/git-commit")({
  component: GitCommit,
});

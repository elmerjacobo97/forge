"use client";

import { RouteError, type RouteErrorBoundaryProps } from "@/components/layout/route-error";

export default function ProjectBoardError(props: RouteErrorBoundaryProps) {
  return (
    <RouteError
      {...props}
      title="Could not load this project board"
      description="The project board could not be loaded. Try again or return to your projects."
      backHref="/dev-board"
      backLabel="Back to projects"
    />
  );
}

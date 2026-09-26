"use client";

import { RouteError, type RouteErrorBoundaryProps } from "@/components/layout/route-error";

export default function ReviewInboxError(props: RouteErrorBoundaryProps) {
  return (
    <RouteError
      {...props}
      title="Could not load the review inbox"
      description="Tickets waiting for validation or review could not be loaded. Try again."
      backHref="/dev-board"
      backLabel="Back to projects"
    />
  );
}

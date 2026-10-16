"use client";

import { RouteError, type RouteErrorBoundaryProps } from "@/components/layout/route-error";

export default function NotesError(props: RouteErrorBoundaryProps) {
  return (
    <RouteError
      {...props}
      title="Could not load notes"
      description="Your notes could not be loaded. Try again."
    />
  );
}

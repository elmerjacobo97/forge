"use client";

import { RouteError, type RouteErrorBoundaryProps } from "@/components/layout/route-error";

export default function ResourcesError(props: RouteErrorBoundaryProps) {
  return (
    <RouteError
      {...props}
      title="Could not load resources"
      description="Your saved links and references could not be loaded. Try again."
    />
  );
}

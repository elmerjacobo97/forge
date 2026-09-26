"use client";

import { RouteError, type RouteErrorBoundaryProps } from "@/components/layout/route-error";

export default function IdeasError(props: RouteErrorBoundaryProps) {
  return (
    <RouteError
      {...props}
      title="Could not load ideas"
      description="Your ideas could not be loaded. Try again."
    />
  );
}

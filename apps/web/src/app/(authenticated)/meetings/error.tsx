"use client";

import { RouteError, type RouteErrorBoundaryProps } from "@/components/layout/route-error";

export default function MeetingsError(props: RouteErrorBoundaryProps) {
  return (
    <RouteError
      {...props}
      title="Could not load meeting notes"
      description="Your meeting history could not be loaded. Try again."
    />
  );
}

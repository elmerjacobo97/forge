"use client";

import { RouteError, type RouteErrorBoundaryProps } from "@/components/layout/route-error";

export default function ProjectsError(props: RouteErrorBoundaryProps) {
  return (
    <RouteError
      {...props}
      title="Could not load projects"
      description="Your Dev Board project list could not be loaded. Try again."
    />
  );
}

"use client";

import { RouteError, type RouteErrorBoundaryProps } from "@/components/layout/route-error";

export default function WebhookInspectorError(props: RouteErrorBoundaryProps) {
  return (
    <RouteError
      {...props}
      title="Could not load webhook inspector"
      description="Your webhook endpoints and captured requests could not be loaded. Try again."
    />
  );
}

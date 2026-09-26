"use client";

import { RouteError, type RouteErrorBoundaryProps } from "@/components/layout/route-error";

export default function UptimeMonitorError(props: RouteErrorBoundaryProps) {
  return (
    <RouteError
      {...props}
      title="Could not load monitors"
      description="Your uptime monitors and recent checks could not be loaded. Try again."
    />
  );
}

"use client";

import { RouteError, type RouteErrorBoundaryProps } from "@/components/layout/route-error";

export default function MonitorDetailError(props: RouteErrorBoundaryProps) {
  return (
    <RouteError
      {...props}
      title="Could not load monitor details"
      description="The monitor and its recent checks could not be loaded. Try again or return to all monitors."
      backHref="/uptime-monitor"
      backLabel="Back to monitors"
    />
  );
}

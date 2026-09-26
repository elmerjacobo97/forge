"use client";

import { RouteError, type RouteErrorBoundaryProps } from "@/components/layout/route-error";

export default function MeetingDetailError(props: RouteErrorBoundaryProps) {
  return (
    <RouteError
      {...props}
      title="Could not load this meeting"
      description="This meeting note could not be loaded. Try again or return to your meeting history."
      backHref="/meetings"
      backLabel="Back to meetings"
    />
  );
}

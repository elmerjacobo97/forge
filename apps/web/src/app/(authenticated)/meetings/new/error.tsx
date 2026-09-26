"use client";

import { RouteError, type RouteErrorBoundaryProps } from "@/components/layout/route-error";

export default function NewMeetingError(props: RouteErrorBoundaryProps) {
  return (
    <RouteError
      {...props}
      title="Could not open a new meeting note"
      description="The meeting editor could not be loaded. Try again or return to your meeting notes."
      backHref="/meetings"
      backLabel="Back to meetings"
    />
  );
}

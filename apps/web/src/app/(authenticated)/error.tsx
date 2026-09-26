"use client";

import { RouteError, type RouteErrorBoundaryProps } from "@/components/layout/route-error";

export default function AuthenticatedError(props: RouteErrorBoundaryProps) {
  return (
    <RouteError
      {...props}
      title="Something went wrong"
      description="This page could not finish loading."
    />
  );
}

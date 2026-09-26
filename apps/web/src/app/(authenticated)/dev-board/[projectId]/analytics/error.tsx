"use client";

import { useParams } from "next/navigation";

import { RouteError, type RouteErrorBoundaryProps } from "@/components/layout/route-error";

export default function ProjectAnalyticsError(props: RouteErrorBoundaryProps) {
  const { projectId } = useParams<{ projectId: string }>();
  const backHref = `/dev-board/${encodeURIComponent(projectId)}`;

  return (
    <RouteError
      {...props}
      title="Could not load project analytics"
      description="Analytics for this project could not be loaded. Try again or return to its board."
      backHref={backHref}
      backLabel="Back to project board"
    />
  );
}

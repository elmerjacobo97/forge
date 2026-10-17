import { RouteLoading } from "@/components/layout/route-loading";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProjectFlowsLoading() {
  return (
    <RouteLoading label="project flows">
      <div className="flex min-h-0 flex-1 flex-col gap-4">
        <div className="flex min-w-0 flex-col gap-2">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-64 max-w-full" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
      </div>
    </RouteLoading>
  );
}

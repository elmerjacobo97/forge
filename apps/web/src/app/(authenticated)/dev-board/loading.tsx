import { RouteLoading } from "@/components/layout/route-loading";
import { Skeleton } from "@/components/ui/skeleton";

const projectRows = ["first", "second", "third", "fourth"];

export default function ProjectsLoading() {
  return (
    <RouteLoading label="projects">
      <div className="flex min-h-0 flex-1 flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-6 w-28" />
            <Skeleton className="h-3 w-60 max-w-full" />
          </div>
          <Skeleton className="h-9 w-28 shrink-0" />
        </div>
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-10 w-full sm:max-w-sm" />
          <Skeleton className="h-10 w-36" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="min-h-0 flex-1 overflow-hidden border border-input/60">
          <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)_minmax(0,1fr)_auto] gap-3 border-b p-3">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-14" />
            <Skeleton className="h-3 w-12" />
          </div>
          {projectRows.map((row) => (
            <div
              key={row}
              className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)_minmax(0,1fr)_auto] items-center gap-3 border-b p-4 last:border-0"
            >
              <Skeleton className="h-4 w-32 max-w-full" />
              <Skeleton className="h-4 w-48 max-w-full" />
              <Skeleton className="h-6 w-24" />
              <Skeleton className="size-8" />
            </div>
          ))}
        </div>
      </div>
    </RouteLoading>
  );
}

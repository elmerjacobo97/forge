import { RouteLoading } from "@/components/layout/route-loading";
import { Skeleton } from "@/components/ui/skeleton";

const monitorRows = ["first", "second", "third", "fourth"];

export default function UptimeMonitorLoading() {
  return (
    <RouteLoading label="uptime monitors">
      <div className="flex min-h-0 flex-1 flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-6 w-36" />
            <Skeleton className="h-3 w-64 max-w-full" />
          </div>
          <Skeleton className="h-9 w-32 shrink-0" />
        </div>
        <div className="min-h-0 flex-1 overflow-hidden border border-input/60">
          <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.5fr)_minmax(0,1fr)_4rem_3rem] gap-3 border-b p-3">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-14" />
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-3 w-8" />
          </div>
          {monitorRows.map((row) => (
            <div
              key={row}
              className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.5fr)_minmax(0,1fr)_4rem_3rem] items-center gap-3 border-b p-4 last:border-0"
            >
              <Skeleton className="h-4 w-40 max-w-full" />
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-7 w-full" />
              <Skeleton className="h-4 w-14" />
              <Skeleton className="h-5 w-8" />
              <Skeleton className="size-7" />
            </div>
          ))}
        </div>
      </div>
    </RouteLoading>
  );
}

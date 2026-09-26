import { RouteLoading } from "@/components/layout/route-loading";
import { Skeleton } from "@/components/ui/skeleton";

const incidents = ["first", "second", "third"];

export default function MonitorDetailLoading() {
  return (
    <RouteLoading label="monitor details">
      <div className="flex min-h-0 flex-1 flex-col gap-4">
        <Skeleton className="h-8 w-36" />
        <div className="flex min-w-0 flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-4 w-64 max-w-full" />
          </div>
          <div className="flex flex-wrap gap-4">
            <Skeleton className="h-14 w-24" />
            <Skeleton className="h-14 w-24" />
            <Skeleton className="h-14 w-24" />
          </div>
        </div>
        <div className="grid min-h-0 gap-4 lg:grid-cols-2">
          <Skeleton className="h-72 w-full" />
          <Skeleton className="h-72 w-full" />
        </div>
        <section className="min-h-0 flex-1 space-y-3">
          <Skeleton className="h-5 w-32" />
          <div className="divide-y divide-border border border-border">
            {incidents.map((incident) => (
              <div
                key={incident}
                className="flex items-center justify-between gap-3 p-4"
              >
                <Skeleton className="h-4 w-48 max-w-full" />
                <Skeleton className="h-4 w-28" />
              </div>
            ))}
          </div>
        </section>
      </div>
    </RouteLoading>
  );
}

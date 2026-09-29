import { RouteLoading } from "@/components/layout/route-loading";
import { Skeleton } from "@/components/ui/skeleton";

const meetingRows = ["first", "second", "third", "fourth"];

export default function MeetingsLoading() {
  return (
    <RouteLoading label="meetings">
      <div className="flex min-h-0 flex-1 flex-col gap-5">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-3 w-72 max-w-full" />
          </div>
          <Skeleton className="h-10 w-36" />
        </header>
        <div className="flex flex-col gap-2 border-y border-border/70 py-3 sm:flex-row">
          <Skeleton className="h-10 w-full sm:max-w-sm" />
          <Skeleton className="h-10 w-full sm:ml-auto sm:w-56" />
        </div>
        <div className="min-h-0 flex-1 overflow-hidden border border-border bg-card">
          <div className="divide-y divide-border">
            {meetingRows.map((row) => (
              <div
                key={row}
                className="flex items-center gap-3 px-3 py-2.5"
              >
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-4 w-56 max-w-full" />
                  <Skeleton className="h-3 w-72 max-w-full" />
                </div>
                <Skeleton className="size-8 shrink-0" />
              </div>
            ))}
          </div>
        </div>
        <div className="flex justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-24" />
        </div>
      </div>
    </RouteLoading>
  );
}

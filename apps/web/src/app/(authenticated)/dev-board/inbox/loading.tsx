import { RouteLoading } from "@/components/layout/route-loading";
import { Skeleton } from "@/components/ui/skeleton";

const inboxRows = ["first", "second", "third", "fourth", "fifth"];

export default function ReviewInboxLoading() {
  return (
    <RouteLoading label="the review inbox">
      <div className="flex min-h-0 flex-1 flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-7 w-24" />
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-3 w-72 max-w-full" />
        </div>
        <div className="min-h-0 flex-1 overflow-hidden border border-input/60">
          <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)_7rem_4rem_minmax(0,2fr)] gap-3 border-b p-3">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-3 w-14" />
            <Skeleton className="h-3 w-8" />
            <Skeleton className="h-3 w-20" />
          </div>
          {inboxRows.map((row) => (
            <div
              key={row}
              className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)_7rem_4rem_minmax(0,2fr)] items-center gap-3 border-b p-4 last:border-0"
            >
              <Skeleton className="h-4 w-28 max-w-full" />
              <Skeleton className="h-4 w-40 max-w-full" />
              <Skeleton className="h-6 w-20" />
              <Skeleton className="size-5" />
              <Skeleton className="h-4 w-full" />
            </div>
          ))}
        </div>
      </div>
    </RouteLoading>
  );
}

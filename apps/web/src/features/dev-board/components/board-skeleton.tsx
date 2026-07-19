import { Skeleton } from "@/components/ui/skeleton";

import { COLUMNS } from "../types/board";

export function BoardSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 gap-3 overflow-x-auto pb-1" aria-label="Loading tickets">
      {COLUMNS.map((column) => (
        <div
          key={column}
          className="flex h-full w-72 shrink-0 flex-col rounded-xl border border-input/40 bg-muted/20"
        >
          <div className="flex items-center justify-between px-3 py-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-5" />
          </div>
          <div className="flex flex-col gap-2 p-2">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

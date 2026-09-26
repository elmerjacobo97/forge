import { Skeleton } from "@/components/ui/skeleton";

const cards = ["first", "second", "third", "fourth", "fifth", "sixth"];

export function ResourceListSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-3 w-64 max-w-full" />
        </div>
        <Skeleton className="h-9 w-28 shrink-0" />
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Skeleton className="h-10 w-full sm:max-w-sm" />
        <Skeleton className="h-10 w-full sm:ml-auto sm:w-44" />
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-1 content-start gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <div
            key={card}
            className="flex min-h-28 flex-col gap-3 border border-input/60 bg-card p-4"
          >
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-4/5" />
          </div>
        ))}
      </div>
      <div className="flex justify-between">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-8 w-24" />
      </div>
    </div>
  );
}

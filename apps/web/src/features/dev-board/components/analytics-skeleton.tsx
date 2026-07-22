import { Skeleton } from "@/components/ui/skeleton";

export function AnalyticsSkeleton() {
  return (
    <div className="grid gap-4">
      <Skeleton className="h-24 w-full rounded-xl" />
      <div className="grid gap-4 xl:grid-cols-2">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton
            key={index}
            className="h-72"
          />
        ))}
      </div>
      <Skeleton className="h-40 w-full rounded-xl" />
    </div>
  );
}

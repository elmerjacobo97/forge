import { Skeleton } from "@/components/ui/skeleton";

export function ChartsSkeleton() {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {Array.from({ length: 4 }, (_, index) => (
        <Skeleton
          key={index}
          className="h-72"
        />
      ))}
    </div>
  );
}

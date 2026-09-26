import { RouteLoading } from "@/components/layout/route-loading";
import { Skeleton } from "@/components/ui/skeleton";

const ideas = ["first", "second", "third", "fourth", "fifth"];

export default function IdeasLoading() {
  return (
    <RouteLoading label="ideas">
      <div className="flex min-h-0 flex-1 flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-3 w-72 max-w-full" />
        </div>
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-10 w-full sm:max-w-sm" />
          <Skeleton className="h-10 w-36" />
          <Skeleton className="h-10 w-28" />
        </div>
        <div className="min-h-0 flex-1 divide-y divide-border overflow-hidden border border-border">
          {ideas.map((idea) => (
            <div
              key={idea}
              className="flex items-start gap-3 p-4"
            >
              <Skeleton className="mt-1 size-4 shrink-0" />
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-between">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-8 w-24" />
        </div>
      </div>
    </RouteLoading>
  );
}

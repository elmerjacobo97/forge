import { RouteLoading } from "@/components/layout/route-loading";
import { Skeleton } from "@/components/ui/skeleton";

export default function MeetingDetailLoading() {
  return (
    <RouteLoading label="this meeting">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 pb-8">
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border/70 pb-4">
          <div className="flex min-w-0 flex-col gap-2">
            <Skeleton className="h-8 w-28" />
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-8 w-64 max-w-full" />
            <Skeleton className="h-4 w-56 max-w-full" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-9 w-20" />
          </div>
        </header>
        <section className="space-y-3">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </section>
        <section className="space-y-3 border-t border-border/70 pt-6">
          <Skeleton className="h-6 w-28" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-2/3" />
        </section>
        <section className="space-y-3 border-t border-border/70 pt-6">
          <Skeleton className="h-6 w-24" />
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-24" />
          </div>
        </section>
      </div>
    </RouteLoading>
  );
}

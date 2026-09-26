import { Skeleton } from "@/components/ui/skeleton";

const actionRows = ["first", "second", "third"];

export function MeetingEditorSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 pb-8">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 pb-4">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-8 w-64 max-w-full" />
        </div>
        <Skeleton className="h-10 w-32" />
      </header>
      <section className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_220px]">
          <div className="space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-11 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-11 w-full" />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-10 w-full sm:max-w-md" />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-28 w-full" />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      </section>
      <section className="space-y-4 border-t border-border/70 pt-6">
        <div className="flex items-center justify-between gap-3">
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-9 w-32" />
        </div>
        <div className="divide-y divide-border border border-border">
          {actionRows.map((row) => (
            <div
              key={row}
              className="flex items-center gap-3 p-4"
            >
              <Skeleton className="size-4 shrink-0" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

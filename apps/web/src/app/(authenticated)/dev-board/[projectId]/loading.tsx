import { RouteLoading } from "@/components/layout/route-loading";
import { Skeleton } from "@/components/ui/skeleton";

const columns = ["backlog", "todo", "in-progress", "validation", "review", "done"];
const cards = ["first", "second", "third"];

export default function ProjectBoardLoading() {
  return (
    <RouteLoading label="the project board">
      <div className="flex min-h-0 flex-1 flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-2">
            <Skeleton className="h-7 w-56 max-w-full" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-28" />
            <Skeleton className="h-9 w-24" />
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-x-auto overflow-y-hidden">
          <div className="grid h-full min-w-max grid-cols-6 gap-3">
            {columns.map((column) => (
              <section
                key={column}
                className="flex min-h-0 w-64 flex-col gap-3 border border-input/60 bg-muted/20 p-3"
              >
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="size-6" />
                </div>
                {cards.map((card) => (
                  <div
                    key={`${column}-${card}`}
                    className="flex flex-col gap-3 border border-input/60 bg-card p-3"
                  >
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-4/5" />
                    <div className="flex justify-between">
                      <Skeleton className="h-5 w-14" />
                      <Skeleton className="size-5" />
                    </div>
                  </div>
                ))}
              </section>
            ))}
          </div>
        </div>
      </div>
    </RouteLoading>
  );
}

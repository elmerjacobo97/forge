import { RouteLoading } from "@/components/layout/route-loading";
import { Skeleton } from "@/components/ui/skeleton";

const actionRows = ["first", "second", "third"];

const headerSkeletons = ["h-8 w-28", "h-3 w-24", "h-8 w-64 max-w-full"];

const fieldSkeletons = [
  {
    key: "title",
    wrapperClassName: "space-y-2",
    labelClassName: "h-4 w-28",
    controlClassName: "h-11 w-full",
  },
  {
    key: "date",
    wrapperClassName: "space-y-2",
    labelClassName: "h-4 w-24",
    controlClassName: "h-11 w-full",
  },
  {
    key: "attendees",
    wrapperClassName: "space-y-2 sm:col-span-2",
    labelClassName: "h-4 w-32",
    controlClassName: "h-10 w-full sm:max-w-md",
  },
  {
    key: "notes",
    wrapperClassName: "space-y-2 sm:col-span-2",
    labelClassName: "h-4 w-20",
    controlClassName: "h-28 w-full",
  },
  {
    key: "summary",
    wrapperClassName: "space-y-2 sm:col-span-2",
    labelClassName: "h-4 w-24",
    controlClassName: "h-24 w-full",
  },
];

export default function EditMeetingLoading() {
  return (
    <RouteLoading label="the meeting editor">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 pb-8">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 pb-4">
          <div className="flex flex-col gap-2">
            {headerSkeletons.map((className) => (
              <Skeleton
                key={className}
                className={className}
              />
            ))}
          </div>
          <Skeleton className="h-10 w-32" />
        </header>
        <section className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_220px]">
            {fieldSkeletons.map((field) => (
              <div
                key={field.key}
                className={field.wrapperClassName}
              >
                <Skeleton className={field.labelClassName} />
                <Skeleton className={field.controlClassName} />
              </div>
            ))}
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
    </RouteLoading>
  );
}

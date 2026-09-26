import { RouteLoading } from "@/components/layout/route-loading";
import { Skeleton } from "@/components/ui/skeleton";

const endpoints = ["first", "second", "third"];
const events = ["one", "two", "three", "four"];

export default function WebhookInspectorLoading() {
  return (
    <RouteLoading label="the webhook inspector">
      <div className="flex min-h-0 flex-1 flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-3 w-96 max-w-full" />
          </div>
          <Skeleton className="h-9 w-24 shrink-0" />
        </div>
        <div className="flex min-h-0 flex-1 flex-col gap-3">
          <section className="flex min-h-0 flex-[0.7] flex-col gap-2 border border-input/60 p-3">
            <Skeleton className="h-4 w-20" />
            {endpoints.map((endpoint) => (
              <Skeleton
                key={endpoint}
                className="h-12 w-full"
              />
            ))}
          </section>
          <section className="grid min-h-0 flex-1 gap-3 border border-input/60 p-3 lg:grid-cols-2">
            <div className="flex min-h-0 flex-col gap-2">
              <Skeleton className="h-4 w-24" />
              {events.map((event) => (
                <Skeleton
                  key={event}
                  className="h-11 w-full"
                />
              ))}
            </div>
            <div className="flex flex-col gap-3 border-t border-border pt-3 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-3">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          </section>
        </div>
      </div>
    </RouteLoading>
  );
}

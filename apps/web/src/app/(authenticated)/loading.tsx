import { Skeleton } from "@/components/ui/skeleton";

export default function AuthenticatedLoading() {
  return (
    <div
      className="flex flex-col gap-4"
      aria-busy="true"
    >
      <p className="sr-only">Loading</p>
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-3 w-72 max-w-full" />
        </div>
        <Skeleton className="h-10 w-28 shrink-0" />
      </div>
      <Skeleton className="h-10 w-full" />
      <div className="flex flex-col gap-3">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton
            key={index}
            className="h-16 w-full"
          />
        ))}
      </div>
    </div>
  );
}

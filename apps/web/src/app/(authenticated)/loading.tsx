import { Skeleton } from "@/components/ui/skeleton";

export default function AuthenticatedLoading() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="ml-auto h-8 w-24" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton
            key={index}
            className="h-32 rounded-xl"
          />
        ))}
      </div>
    </div>
  );
}

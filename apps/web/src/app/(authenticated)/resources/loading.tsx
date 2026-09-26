import { RouteLoading } from "@/components/layout/route-loading";
import { ResourceListSkeleton } from "@/features/resources/components/resource-list-skeleton";

export default function ResourcesLoading() {
  return (
    <RouteLoading label="resources">
      <ResourceListSkeleton />
    </RouteLoading>
  );
}

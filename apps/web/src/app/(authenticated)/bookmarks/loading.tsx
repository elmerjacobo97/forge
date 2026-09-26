import { RouteLoading } from "@/components/layout/route-loading";
import { ResourceListSkeleton } from "@/features/resources/components/resource-list-skeleton";

export default function BookmarksLoading() {
  return (
    <RouteLoading label="saved resources">
      <ResourceListSkeleton />
    </RouteLoading>
  );
}

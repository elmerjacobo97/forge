import { Resources } from "@/features/resources/resources";
import { parseResourceFilters } from "@/features/resources/schemas/resource-filters";
import { resourcesService } from "@/features/resources/services/resources-service";
import { parseVisibleParam } from "@/lib/pagination";

export default async function ResourcesPage({ searchParams }: PageProps<"/resources">) {
  const params = await searchParams;
  const filters = parseResourceFilters(params);
  const visible = parseVisibleParam(params.visible);
  const { resources, tags, total } = await resourcesService.fetchResourcesPage(filters, visible);

  return (
    <Resources
      resources={resources}
      filters={filters}
      tags={tags}
      total={total}
    />
  );
}

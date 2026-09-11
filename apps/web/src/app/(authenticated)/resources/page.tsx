import { Resources } from "@/features/resources/resources";
import { parseResourceFilters } from "@/features/resources/schemas/resource-filters";
import { resourcesService } from "@/features/resources/services/resources-service";

export default async function ResourcesPage({ searchParams }: PageProps<"/resources">) {
  const filters = parseResourceFilters(await searchParams);
  const { resources, tags } = await resourcesService.fetchResourcesPage(filters);

  return (
    <Resources
      resources={resources}
      filters={filters}
      tags={tags}
    />
  );
}

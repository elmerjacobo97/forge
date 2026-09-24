import { Resources } from "@/features/resources/resources";
import { parseResourceFilters } from "@/features/resources/schemas/resources-schema";
import { resourcesService } from "@/features/resources/services/resources-service";
import { parseVisibleParam } from "@/lib/pagination";

export default async function ResourcesPage({ searchParams }: PageProps<"/resources">) {
  const params = await searchParams;
  const filters = parseResourceFilters(params);
  const visible = parseVisibleParam(params.visible);
  const { resources, total } = await resourcesService.fetchResources(filters, visible);

  return (
    <Resources
      resources={resources}
      filters={filters}
      total={total}
    />
  );
}

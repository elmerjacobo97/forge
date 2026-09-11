import { Code2 } from "lucide-react";

import { ResourceCard } from "./components/resource-card";
import { ResourcesToolbar } from "./components/resources-toolbar";
import type { ResourceFilters } from "./schemas/resource-filters";
import type { Resource } from "./types";

export function Resources({
  resources,
  filters,
  tags,
}: {
  resources: Resource[];
  filters: ResourceFilters;
  tags: string[];
}) {
  return (
    <div className="flex h-full flex-col gap-4">
      <ResourcesToolbar
        filters={filters}
        tags={tags}
      />

      <div className="min-h-0 flex-1 overflow-y-auto">
        {resources.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
            <Code2 className="size-8 text-muted-foreground/40" />
            <p className="text-sm font-medium">No resources found</p>
            <p className="text-xs text-muted-foreground">
              Refine your search or add a new resource.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {resources.map((resource) => (
              <ResourceCard
                key={resource.id}
                resource={resource}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

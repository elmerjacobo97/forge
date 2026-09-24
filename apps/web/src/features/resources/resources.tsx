import { HugeiconsIcon } from "@hugeicons/react";
import { Globe02Icon } from "@hugeicons/core-free-icons";

import { ListPagination } from "@/components/list-pagination";
import { ResourceCard } from "./components/resource-card";
import { ResourcesToolbar } from "./components/resources-toolbar";
import type { ResourceFilters } from "./schemas/resources-schema";
import type { Resource } from "./types";

export function Resources({
  resources,
  filters,
  total,
}: {
  resources: Resource[];
  filters: ResourceFilters;
  total: number;
}) {
  return (
    <div className="flex h-full flex-col gap-4">
      <div>
        <h1 className="font-heading text-lg font-medium tracking-tight">Resources</h1>
        <p className="text-xs text-muted-foreground">
          Save and organize developer links and references.
        </p>
      </div>

      <ResourcesToolbar filters={filters} />

      <div className="min-h-0 flex-1 overflow-y-auto">
        {resources.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
            <HugeiconsIcon
              icon={Globe02Icon}
              strokeWidth={2}
              className="size-8 text-muted-foreground/40"
            />
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

      <ListPagination
        loaded={resources.length}
        total={total}
      />
    </div>
  );
}

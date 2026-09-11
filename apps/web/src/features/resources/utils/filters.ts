import { FORMATS } from "../constants";
import type { ResourceFilters } from "../schemas/resource-filters";
import type { Resource } from "../types";

export function filterResources(resources: Resource[], filters: ResourceFilters): Resource[] {
  const query = filters.q.trim().toLowerCase();

  return resources.filter((resource) => {
    const matchesSearch =
      !query ||
      resource.title.toLowerCase().includes(query) ||
      resource.content.toLowerCase().includes(query) ||
      resource.tags.some((tag) => tag.toLowerCase().includes(query));
    const matchesKind = filters.kind === "all" || resource.kind === filters.kind;
    const matchesTool = filters.tool === "all" || resource.tool === filters.tool;

    const normalizedFormat = resource.language?.toLowerCase();
    const isKnownFormat = normalizedFormat
      ? FORMATS.some((format) => format.value === normalizedFormat)
      : false;
    const matchesFormat =
      filters.format === "all" ||
      (filters.format === "other"
        ? resource.language === "other" || (resource.language !== null && !isKnownFormat)
        : normalizedFormat === filters.format);

    const matchesTag = filters.tag === "all" || resource.tags.includes(filters.tag);
    return matchesSearch && matchesKind && matchesTool && matchesFormat && matchesTag;
  });
}

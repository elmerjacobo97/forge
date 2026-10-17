import { z } from "zod";

const slugSchema = z
  .string()
  .max(60)
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/);

export interface MapParams {
  moduleSlug: string | null;
  flowSlug: string | null;
}

function slugFromQuery(value: string | string[] | undefined): string | null {
  const parsed = slugSchema.safeParse(Array.isArray(value) ? value[0] : value);
  return parsed.success ? parsed.data : null;
}

export function parseMapParams(query: Record<string, string | string[] | undefined>): MapParams {
  return { moduleSlug: slugFromQuery(query.module), flowSlug: slugFromQuery(query.flow) };
}

export function mapHref(projectId: string, params: Partial<MapParams> = {}): string {
  const search = new URLSearchParams();
  if (params.moduleSlug) search.set("module", params.moduleSlug);
  if (params.flowSlug) search.set("flow", params.flowSlug);
  const query = search.toString();
  return `/dev-board/${projectId}/flows${query ? `?${query}` : ""}`;
}

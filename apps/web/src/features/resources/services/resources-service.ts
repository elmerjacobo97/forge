import "server-only";

import { z } from "zod";

import { createInsForgeServerClient } from "@/lib/insforge/server";
import type { ResourceFilters } from "../schemas/resources-schema";
import type { Resource } from "../types";
import { buildResourceSearchFilter } from "../utils/query-filters";

const COLUMNS = "id,title,url,category,description,tags,created_at";

const resourceRowSchema = z.object({
  id: z.string(),
  title: z.string(),
  url: z.string(),
  category: z.enum(["docs", "git", "tool", "article", "other"]),
  description: z.string(),
  tags: z.array(z.string()),
  created_at: z.string(),
});

export interface ResourcesPage {
  resources: Resource[];
  total: number;
}

export type ResourceInput = Omit<Resource, "id" | "createdAt">;

function toResource(value: unknown): Resource {
  const row = resourceRowSchema.parse(value);
  return {
    id: row.id,
    title: row.title,
    url: row.url,
    category: row.category,
    description: row.description,
    tags: row.tags,
    createdAt: row.created_at,
  };
}

function failure(error: { message?: string } | null, fallback: string): Error {
  return new Error(error?.message || fallback);
}

export const resourcesService = {
  async fetchResources(filters: ResourceFilters, visible: number): Promise<ResourcesPage> {
    const insforge = await createInsForgeServerClient();
    let query = insforge.database.from("resources").select(COLUMNS, { count: "exact" });

    if (filters.category !== "all") {
      query = query.eq("category", filters.category);
    }

    const search = filters.q.trim();
    if (search) {
      query = query.or(buildResourceSearchFilter(search));
    }

    const { data, error, count } = await query
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .range(0, visible - 1);
    if (error) throw failure(error, "Failed to load resources.");

    return {
      resources: resourceRowSchema.array().parse(data).map(toResource),
      total: count ?? 0,
    };
  },

  async createResource(resource: ResourceInput): Promise<Resource> {
    const insforge = await createInsForgeServerClient();
    const { data, error } = await insforge.database
      .from("resources")
      .insert([resource])
      .select(COLUMNS)
      .single();
    if (error) throw failure(error, "Failed to create resource.");
    return toResource(data);
  },

  async updateResource(resourceId: string, resource: ResourceInput): Promise<Resource> {
    const insforge = await createInsForgeServerClient();
    const { data, error } = await insforge.database
      .from("resources")
      .update(resource)
      .eq("id", resourceId)
      .select(COLUMNS)
      .single();
    if (error) throw failure(error, "Failed to update resource.");
    return toResource(data);
  },

  async deleteResource(resourceId: string): Promise<void> {
    const insforge = await createInsForgeServerClient();
    const { error } = await insforge.database.from("resources").delete().eq("id", resourceId);
    if (error) throw failure(error, "Failed to delete resource.");
  },
};

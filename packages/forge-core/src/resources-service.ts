import type { InsForgeClient } from "@insforge/sdk";
import { asRecord, asRows, stringField, throwIfError } from "./insforge-data.js";
import { RESOURCE_CATEGORIES } from "./types.js";
import type {
  ListOptions,
  Resource,
  ResourceCreateInput,
  ResourceCategory,
  ResourceUpdateInput,
} from "./types.js";

const TABLE = "resources";
const COLUMNS = "id,title,url,category,description,tags,created_at";

function isResourceCategory(value: unknown): value is ResourceCategory {
  return typeof value === "string" && (RESOURCE_CATEGORIES as readonly string[]).includes(value);
}

function asTags(value: unknown): string[] {
  if (!Array.isArray(value) || value.some((tag) => typeof tag !== "string")) {
    throw new Error("Invalid resource row: tags must be a string array.");
  }
  return value;
}

export function mapRowToResource(value: unknown): Resource {
  const row = asRecord(value, "resource row");
  const category = row.category;
  if (!isResourceCategory(category)) {
    throw new Error(
      `Invalid resource row: category must be one of ${RESOURCE_CATEGORIES.join(", ")}.`,
    );
  }

  return {
    id: stringField(row, "id", "resource row"),
    title: stringField(row, "title", "resource row"),
    url: stringField(row, "url", "resource row"),
    category,
    description: stringField(row, "description", "resource row"),
    tags: asTags(row.tags),
    createdAt: stringField(row, "created_at", "resource row"),
  };
}

function toResourcePayload(input: ResourceCreateInput) {
  return {
    title: input.title,
    url: input.url,
    category: input.category,
    description: input.description,
    tags: input.tags,
  };
}

export type ResourcesServiceDeps = { client: InsForgeClient };

export function createResourcesService({ client }: ResourcesServiceDeps) {
  async function get(id: string): Promise<Resource> {
    const response = await client.database.from(TABLE).select(COLUMNS).eq("id", id).maybeSingle();
    throwIfError(response.error, "Failed to get resource.");
    const data: unknown = response.data;
    if (data === null) throw new Error("Resource not found.");
    return mapRowToResource(data);
  }

  return {
    async list(options: ListOptions = {}): Promise<Resource[]> {
      let query = client.database
        .from(TABLE)
        .select(COLUMNS)
        .order("created_at", { ascending: false });
      if (options.limit !== undefined) {
        const offset = options.offset ?? 0;
        query = query.range(offset, offset + options.limit - 1);
      }
      const response = await query;
      throwIfError(response.error, "Failed to list resources.");
      const data: unknown = response.data;
      return asRows(data, "resource list").map(mapRowToResource);
    },

    get,

    async create(input: ResourceCreateInput): Promise<Resource> {
      const response = await client.database
        .from(TABLE)
        .insert([toResourcePayload(input)])
        .select(COLUMNS)
        .single();
      throwIfError(response.error, "Failed to create resource.");
      const data: unknown = response.data;
      return mapRowToResource(data);
    },

    async update(id: string, input: ResourceUpdateInput): Promise<Resource> {
      const changes: Record<string, unknown> = {};
      if (input.title !== undefined) changes.title = input.title;
      if (input.url !== undefined) changes.url = input.url;
      if (input.category !== undefined) changes.category = input.category;
      if (input.description !== undefined) changes.description = input.description;
      if (input.tags !== undefined) changes.tags = input.tags;
      if (Object.keys(changes).length === 0) {
        throw new Error("Nothing to update. Provide at least one field.");
      }

      await get(id);
      const response = await client.database
        .from(TABLE)
        .update(changes)
        .eq("id", id)
        .select(COLUMNS)
        .single();
      throwIfError(response.error, "Failed to update resource.");
      const data: unknown = response.data;
      return mapRowToResource(data);
    },

    async delete(id: string): Promise<void> {
      await get(id);
      const response = await client.database.from(TABLE).delete().eq("id", id);
      throwIfError(response.error, "Failed to delete resource.");
    },
  };
}

export type ResourcesService = ReturnType<typeof createResourcesService>;

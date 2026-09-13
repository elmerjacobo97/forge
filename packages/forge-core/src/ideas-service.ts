import type { InsForgeClient } from "@insforge/sdk";
import { asRecord, asRows, stringField, throwIfError } from "./insforge-data.js";
import { IDEA_CATEGORIES, IDEA_STATUSES } from "./types.js";
import type {
  Idea,
  IdeaCategory,
  IdeaCreateInput,
  IdeaStatus,
  IdeaUpdateInput,
  ListOptions,
} from "./types.js";

const TABLE = "ideas";
const COLUMNS = "id,title,content,status,category,tags,links,created_at";

function isIdeaStatus(value: unknown): value is IdeaStatus {
  return typeof value === "string" && (IDEA_STATUSES as readonly string[]).includes(value);
}

function isIdeaCategory(value: unknown): value is IdeaCategory {
  return typeof value === "string" && (IDEA_CATEGORIES as readonly string[]).includes(value);
}

function asStringArray(value: unknown, field: string): string[] {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw new Error(`Invalid idea row: ${field} must be a string array.`);
  }
  return value;
}

export function mapRowToIdea(value: unknown): Idea {
  const row = asRecord(value, "idea row");
  const status = row.status;
  if (!isIdeaStatus(status)) {
    throw new Error(`Invalid idea row: status must be one of ${IDEA_STATUSES.join(", ")}.`);
  }

  const category = row.category;
  if (!isIdeaCategory(category)) {
    throw new Error(`Invalid idea row: category must be one of ${IDEA_CATEGORIES.join(", ")}.`);
  }

  return {
    id: stringField(row, "id", "idea row"),
    title: stringField(row, "title", "idea row"),
    content: stringField(row, "content", "idea row"),
    status,
    category,
    tags: asStringArray(row.tags, "tags"),
    links: asStringArray(row.links, "links"),
    createdAt: stringField(row, "created_at", "idea row"),
  };
}

function toIdeaPayload(input: IdeaCreateInput) {
  return {
    title: input.title,
    content: input.content,
    status: input.status,
    category: input.category,
    tags: input.tags,
    links: input.links,
  };
}

export type IdeasServiceDeps = { client: InsForgeClient };

export function createIdeasService({ client }: IdeasServiceDeps) {
  async function get(id: string): Promise<Idea> {
    const response = await client.database.from(TABLE).select(COLUMNS).eq("id", id).maybeSingle();
    throwIfError(response.error, "Failed to get idea.");
    const data: unknown = response.data;
    if (data === null) throw new Error("Idea not found.");
    return mapRowToIdea(data);
  }

  return {
    async list(options: ListOptions = {}): Promise<Idea[]> {
      let query = client.database
        .from(TABLE)
        .select(COLUMNS)
        .order("created_at", { ascending: false });
      if (options.limit !== undefined) {
        const offset = options.offset ?? 0;
        query = query.range(offset, offset + options.limit - 1);
      }
      const response = await query;
      throwIfError(response.error, "Failed to list ideas.");
      const data: unknown = response.data;
      return asRows(data, "idea list").map(mapRowToIdea);
    },

    get,

    async create(input: IdeaCreateInput): Promise<Idea> {
      const response = await client.database
        .from(TABLE)
        .insert([toIdeaPayload(input)])
        .select(COLUMNS)
        .single();
      throwIfError(response.error, "Failed to create idea.");
      const data: unknown = response.data;
      return mapRowToIdea(data);
    },

    async update(id: string, input: IdeaUpdateInput): Promise<Idea> {
      const changes: Record<string, unknown> = {};
      if (input.title !== undefined) changes.title = input.title;
      if (input.content !== undefined) changes.content = input.content;
      if (input.status !== undefined) changes.status = input.status;
      if (input.category !== undefined) changes.category = input.category;
      if (input.tags !== undefined) changes.tags = input.tags;
      if (input.links !== undefined) changes.links = input.links;
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
      throwIfError(response.error, "Failed to update idea.");
      const data: unknown = response.data;
      return mapRowToIdea(data);
    },

    async delete(id: string): Promise<void> {
      await get(id);
      const response = await client.database.from(TABLE).delete().eq("id", id);
      throwIfError(response.error, "Failed to delete idea.");
    },
  };
}

export type IdeasService = ReturnType<typeof createIdeasService>;

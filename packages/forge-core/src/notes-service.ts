import type { InsForgeClient } from "@insforge/sdk";
import { asRecord, asRows, stringField, throwIfError } from "./insforge-data.js";
import type { Note, NoteCreateInput, NoteListOptions, NoteUpdateInput } from "./types.js";

const TABLE = "notes";
const COLUMNS = "id,title,content,tags,project_id,created_at,updated_at";

function asTags(value: unknown): string[] {
  if (!Array.isArray(value) || value.some((tag) => typeof tag !== "string")) {
    throw new Error("Invalid note row: tags must be a string array.");
  }
  return value;
}

function asProjectId(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== "string") {
    throw new Error("Invalid note row: project_id must be a string or null.");
  }
  return value;
}

export function mapRowToNote(value: unknown): Note {
  const row = asRecord(value, "note row");

  return {
    id: stringField(row, "id", "note row"),
    title: stringField(row, "title", "note row"),
    content: stringField(row, "content", "note row"),
    tags: asTags(row.tags),
    projectId: asProjectId(row.project_id),
    createdAt: stringField(row, "created_at", "note row"),
    updatedAt: stringField(row, "updated_at", "note row"),
  };
}

function quote(value: string): string {
  return `"${value.replace(/([\\"])/g, "\\$1")}"`;
}

function buildSearchFilter(q: string): string {
  const pattern = `%${q.replace(/([\\%_])/g, "\\$1")}%`;
  return [
    `title.ilike.${quote(pattern)}`,
    `content.ilike.${quote(pattern)}`,
    `tags.cs.{${quote(q.toLowerCase())}}`,
  ].join(",");
}

export type NotesServiceDeps = { client: InsForgeClient };

export function createNotesService({ client }: NotesServiceDeps) {
  async function get(id: string): Promise<Note> {
    const response = await client.database.from(TABLE).select(COLUMNS).eq("id", id).maybeSingle();
    throwIfError(response.error, "Failed to get note.");
    const data: unknown = response.data;
    if (data === null) throw new Error("Note not found.");
    return mapRowToNote(data);
  }

  return {
    async list(options: NoteListOptions = {}): Promise<Note[]> {
      let query = client.database.from(TABLE).select(COLUMNS);
      if (options.projectId !== undefined) query = query.eq("project_id", options.projectId);
      if (options.tag !== undefined) query = query.contains("tags", [options.tag.toLowerCase()]);
      if (options.q !== undefined && options.q.length > 0) {
        query = query.or(buildSearchFilter(options.q));
      }
      query = query.order("created_at", { ascending: false });
      if (options.limit !== undefined) {
        const offset = options.offset ?? 0;
        query = query.range(offset, offset + options.limit - 1);
      }
      const response = await query;
      throwIfError(response.error, "Failed to list notes.");
      const data: unknown = response.data;
      return asRows(data, "note list").map(mapRowToNote);
    },

    get,

    async create(input: NoteCreateInput): Promise<Note> {
      const response = await client.database
        .from(TABLE)
        .insert([
          {
            title: input.title,
            content: input.content,
            tags: input.tags,
            project_id: input.projectId ?? null,
          },
        ])
        .select(COLUMNS)
        .single();
      throwIfError(response.error, "Failed to create note.");
      const data: unknown = response.data;
      return mapRowToNote(data);
    },

    async update(id: string, input: NoteUpdateInput): Promise<Note> {
      const changes: Record<string, unknown> = {};
      if (input.title !== undefined) changes.title = input.title;
      if (input.content !== undefined) changes.content = input.content;
      if (input.tags !== undefined) changes.tags = input.tags;
      if (input.projectId !== undefined) changes.project_id = input.projectId;
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
      throwIfError(response.error, "Failed to update note.");
      const data: unknown = response.data;
      return mapRowToNote(data);
    },

    async delete(id: string): Promise<void> {
      await get(id);
      const response = await client.database.from(TABLE).delete().eq("id", id);
      throwIfError(response.error, "Failed to delete note.");
    },
  };
}

export type NotesService = ReturnType<typeof createNotesService>;

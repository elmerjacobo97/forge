import "server-only";

import { z } from "zod";

import { createInsForgeServerClient } from "@/lib/insforge/server";
import type { NoteFilters } from "../schemas/note-filters";
import type { Note } from "../types";
import { buildNoteSearchFilter } from "../utils/query-filters";

const noteRowSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  tags: z.array(z.string()),
  project_id: z.string().nullable(),
  created_at: z.string(),
});

export type NoteInput = Omit<Note, "id" | "createdAt">;

const noteSelect = "id,title,content,tags,project_id,created_at";

function toNote(value: unknown): Note {
  const row = noteRowSchema.parse(value);
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    tags: row.tags,
    projectId: row.project_id,
    createdAt: row.created_at,
  };
}

function toNotePayload(note: NoteInput) {
  return {
    title: note.title,
    content: note.content,
    tags: note.tags,
    project_id: note.projectId,
  };
}

function failure(error: { message?: string } | null, fallback: string): Error {
  return new Error(error?.message || fallback);
}

export interface NotesPage {
  notes: Note[];
  tags: string[];
  total: number;
}

const noteTagsRowSchema = z.object({
  tags: z.array(z.string()),
});

export const notesService = {
  async fetchNotesPage(filters: NoteFilters, visible: number): Promise<NotesPage> {
    const insforge = await createInsForgeServerClient();
    let query = insforge.database.from("notes").select(noteSelect, { count: "exact" });

    if (filters.project !== "all") {
      query = query.eq("project_id", filters.project);
    }

    if (filters.tag !== "all") {
      query = query.contains("tags", [filters.tag]);
    }

    const search = filters.q.trim();
    if (search) {
      query = query.or(buildNoteSearchFilter(search));
    }

    const [pageResult, tagsResult] = await Promise.all([
      query
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
        .range(0, visible - 1),
      insforge.database.from("notes").select("tags"),
    ]);
    if (pageResult.error) throw failure(pageResult.error, "Failed to load notes.");
    if (tagsResult.error) throw failure(tagsResult.error, "Failed to load note tags.");

    const notes = noteRowSchema.array().parse(pageResult.data).map(toNote);
    const tags = Array.from(
      new Set(
        noteTagsRowSchema
          .array()
          .parse(tagsResult.data)
          .flatMap((row) => row.tags),
      ),
    ).sort((a, b) => a.localeCompare(b));

    return { notes, tags, total: pageResult.count ?? 0 };
  },

  async createNote(note: NoteInput): Promise<Note> {
    const insforge = await createInsForgeServerClient();
    const { data, error } = await insforge.database
      .from("notes")
      .insert([toNotePayload(note)])
      .select(noteSelect)
      .single();
    if (error) throw failure(error, "Failed to create note.");
    return toNote(data);
  },

  async updateNote(noteId: string, note: NoteInput): Promise<Note> {
    const insforge = await createInsForgeServerClient();
    const { data, error } = await insforge.database
      .from("notes")
      .update(toNotePayload(note))
      .eq("id", noteId)
      .select(noteSelect)
      .single();
    if (error) throw failure(error, "Failed to update note.");
    return toNote(data);
  },

  async deleteNote(noteId: string): Promise<void> {
    const insforge = await createInsForgeServerClient();
    const { error } = await insforge.database.from("notes").delete().eq("id", noteId);
    if (error) throw failure(error, "Failed to delete note.");
  },
};

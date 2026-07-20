import { z } from "zod";

import { insforge } from "@/lib/insforge/browser";
import type { Snippet } from "../types";

const snippetRowSchema = z.object({
  id: z.string(),
  title: z.string(),
  kind: z.enum(["note", "prompt", "config", "snippet"]),
  content: z.string(),
  language: z.string().nullable(),
  tags: z.array(z.string()),
  created_at: z.string(),
});

type SnippetInput = Omit<Snippet, "id" | "createdAt">;

function requireUser(userId?: string): void {
  if (!userId) throw new Error("Sign in to use Snippets.");
}

function toSnippet(value: unknown): Snippet {
  const row = snippetRowSchema.parse(value);
  return { ...row, createdAt: row.created_at };
}

function failure(error: { message?: string } | null, fallback: string): Error {
  return new Error(error?.message || fallback);
}

export const snippetsService = {
  async fetchSnippets(userId?: string): Promise<Snippet[]> {
    requireUser(userId);
    const { data, error } = await insforge.database
      .from("snippets")
      .select("id,title,kind,content,language,tags,created_at")
      .order("created_at", { ascending: false });
    if (error) throw failure(error, "Failed to load snippets.");
    return snippetRowSchema.array().parse(data).map(toSnippet);
  },

  async createSnippet(snippet: SnippetInput, userId?: string): Promise<Snippet> {
    requireUser(userId);
    const { data, error } = await insforge.database
      .from("snippets")
      .insert([snippet])
      .select("id,title,kind,content,language,tags,created_at")
      .single();
    if (error) throw failure(error, "Failed to create snippet.");
    return toSnippet(data);
  },

  async updateSnippet(
    snippetId: string,
    snippet: SnippetInput,
    userId?: string,
  ): Promise<Snippet> {
    requireUser(userId);
    const { data, error } = await insforge.database
      .from("snippets")
      .update(snippet)
      .eq("id", snippetId)
      .select("id,title,kind,content,language,tags,created_at")
      .single();
    if (error) throw failure(error, "Failed to update snippet.");
    return toSnippet(data);
  },

  async deleteSnippet(snippetId: string, userId?: string): Promise<void> {
    requireUser(userId);
    const { error } = await insforge.database.from("snippets").delete().eq("id", snippetId);
    if (error) throw failure(error, "Failed to delete snippet.");
  },
};

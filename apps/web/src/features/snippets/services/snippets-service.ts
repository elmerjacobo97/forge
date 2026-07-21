import { z } from "zod";

import { insforge } from "@/lib/insforge/browser";
import type { Snippet } from "../types";

const snippetToolSchema = z.enum([
  "react-native",
  "vscode",
  "cursor",
  "opencode",
  "claude-code",
  "other",
]);

const snippetRowSchema = z.object({
  id: z.string(),
  title: z.string(),
  kind: z.enum(["note", "prompt", "config", "snippet"]),
  content: z.string(),
  language: z.string().nullable(),
  tags: z.array(z.string()),
  tool: snippetToolSchema.nullable(),
  custom_tool: z.string().nullable(),
  version: z.string().nullable(),
  context: z.string().nullable(),
  created_at: z.string(),
});

type SnippetInput = Omit<Snippet, "id" | "createdAt">;
const snippetSelect =
  "id,title,kind,content,language,tags,tool,custom_tool,version,context,created_at";

function requireUser(userId?: string): void {
  if (!userId) throw new Error("Sign in to use Resources.");
}

function toSnippet(value: unknown): Snippet {
  const row = snippetRowSchema.parse(value);
  return {
    id: row.id,
    title: row.title,
    kind: row.kind,
    content: row.content,
    language: row.language,
    tags: row.tags,
    tool: row.tool,
    customTool: row.custom_tool,
    version: row.version,
    context: row.context,
    createdAt: row.created_at,
  };
}

function toSnippetPayload(snippet: SnippetInput) {
  return {
    title: snippet.title,
    kind: snippet.kind,
    content: snippet.content,
    language: snippet.language,
    tags: snippet.tags,
    tool: snippet.tool,
    custom_tool: snippet.customTool,
    version: snippet.version,
    context: snippet.context,
  };
}

function failure(error: { message?: string } | null, fallback: string): Error {
  return new Error(error?.message || fallback);
}

export const snippetsService = {
  async fetchSnippets(userId?: string): Promise<Snippet[]> {
    requireUser(userId);
    const { data, error } = await insforge.database
      .from("snippets")
      .select(snippetSelect)
      .order("created_at", { ascending: false });
    if (error) throw failure(error, "Failed to load resources.");
    return snippetRowSchema.array().parse(data).map(toSnippet);
  },

  async createSnippet(snippet: SnippetInput, userId?: string): Promise<Snippet> {
    requireUser(userId);
    const { data, error } = await insforge.database
      .from("snippets")
      .insert([toSnippetPayload(snippet)])
      .select(snippetSelect)
      .single();
    if (error) throw failure(error, "Failed to create resource.");
    return toSnippet(data);
  },

  async updateSnippet(snippetId: string, snippet: SnippetInput, userId?: string): Promise<Snippet> {
    requireUser(userId);
    const { data, error } = await insforge.database
      .from("snippets")
      .update(toSnippetPayload(snippet))
      .eq("id", snippetId)
      .select(snippetSelect)
      .single();
    if (error) throw failure(error, "Failed to update resource.");
    return toSnippet(data);
  },

  async deleteSnippet(snippetId: string, userId?: string): Promise<void> {
    requireUser(userId);
    const { error } = await insforge.database.from("snippets").delete().eq("id", snippetId);
    if (error) throw failure(error, "Failed to delete resource.");
  },
};

import {
  fetchFeatureRows,
  createFeatureRow,
  deleteFeatureRow,
  isAppwriteDataEnabled,
} from "@/lib/appwrite-data";
import type { Snippet } from "../types";

const FEATURE = "snippets";

type SnippetPayload = Omit<Snippet, "id" | "createdAt">;

function requireAppwriteAccess(userId?: string): string {
  if (!userId) throw new Error("Sign in to use Snippets.");
  if (!isAppwriteDataEnabled(userId)) throw new Error("Snippets storage is not configured.");
  return userId;
}

export const snippetsService = {
  async fetchSnippets(userId?: string): Promise<Snippet[]> {
    const resolvedUserId = requireAppwriteAccess(userId);
    const rows = await fetchFeatureRows<SnippetPayload>(FEATURE, resolvedUserId);
    return rows.map((row) => ({
      id: row.id,
      createdAt: row.createdAt,
      ...row.payload,
    }));
  },

  async createSnippet(
    snippet: SnippetPayload,
    userId?: string,
  ): Promise<Snippet> {
    const resolvedUserId = requireAppwriteAccess(userId);
    const row = await createFeatureRow<SnippetPayload>(FEATURE, snippet, resolvedUserId);
    return {
      id: row.id,
      createdAt: row.createdAt,
      ...row.payload,
    };
  },

  async deleteSnippet(snippetId: string, userId?: string): Promise<void> {
    requireAppwriteAccess(userId);
    await deleteFeatureRow(snippetId);
  },
};

import {
  fetchFeatureRows,
  createFeatureRow,
  deleteFeatureRow,
  isAppwriteDataEnabled,
} from "@/lib/appwrite-data";
import type { Snippet } from "../types";

const STORAGE_KEY = "forge_snippets:v1";
const FEATURE = "snippets";

type SnippetPayload = Omit<Snippet, "id" | "createdAt">;

const getLocalSnippets = (): Snippet[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return [];
  try {
    return JSON.parse(data) as Snippet[];
  } catch {
    return [];
  }
};

const saveLocalSnippets = (snippets: Snippet[]): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(snippets));
};

export const snippetsService = {
  isAppwriteEnabled: isAppwriteDataEnabled,

  async fetchSnippets(userId?: string): Promise<Snippet[]> {
    if (this.isAppwriteEnabled(userId)) {
      try {
        const rows = await fetchFeatureRows<SnippetPayload>(FEATURE, userId!);
        return rows.map((row) => ({
          id: row.id,
          createdAt: row.createdAt,
          ...row.payload,
        }));
      } catch (error) {
        console.error(
          "Failed to fetch snippets from Appwrite, falling back to local storage:",
          error,
        );
        return getLocalSnippets();
      }
    }
    return getLocalSnippets();
  },

  async createSnippet(
    snippet: SnippetPayload,
    userId?: string,
  ): Promise<Snippet> {
    if (this.isAppwriteEnabled(userId)) {
      const row = await createFeatureRow<SnippetPayload>(FEATURE, snippet, userId!);
      return {
        id: row.id,
        createdAt: row.createdAt,
        ...row.payload,
      };
    } else {
      const localSnippets = getLocalSnippets();
      const newSnippet: Snippet = {
        id: `local-${crypto.randomUUID()}`,
        ...snippet,
        createdAt: new Date().toISOString(),
      };
      saveLocalSnippets([newSnippet, ...localSnippets]);
      return newSnippet;
    }
  },

  async deleteSnippet(snippetId: string, userId?: string): Promise<void> {
    if (this.isAppwriteEnabled(userId) && !snippetId.startsWith("local-")) {
      await deleteFeatureRow(snippetId);
    } else {
      const localSnippets = getLocalSnippets();
      const updated = localSnippets.filter((s) => s.id !== snippetId);
      saveLocalSnippets(updated);
    }
  },
};

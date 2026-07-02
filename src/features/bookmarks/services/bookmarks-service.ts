import { databases } from "@/lib/appwrite";
import { Query, ID } from "appwrite";
import type { DevLink } from "../types";

const STORAGE_KEY = "forge_bookmarks:v1";

const SEED_LINKS: DevLink[] = [
  {
    id: "seed-link-1",
    title: "Tailwind CSS v4 Docs",
    url: "https://tailwindcss.com",
    category: "docs",
    description:
      "Documentation for the latest Tailwind CSS version featuring a new rust-based engine, simplified configuration, and native cascade layers.",
    tags: ["css", "styling", "tailwind", "framework"],
    createdAt: "2025-06-15T12:00:00.000Z",
  },
  {
    id: "seed-link-2",
    title: "TanStack Router Docs",
    url: "https://tanstack.com/router",
    category: "docs",
    description:
      "Fully type-safe router for React featuring built-in state management, search param validation, and code-splitting out of the box.",
    tags: ["routing", "react", "tanstack", "type-safe"],
    createdAt: "2025-06-16T12:00:00.000Z",
  },
  {
    id: "seed-link-3",
    title: "shadcn/ui Components",
    url: "https://ui.shadcn.com",
    category: "tool",
    description:
      "Beautifully designed accessible components built with Radix UI and Tailwind CSS that you can copy and paste.",
    tags: ["ui", "components", "radix", "shadcn"],
    createdAt: "2025-06-19T12:00:00.000Z",
  },
];

const getLocalLinks = (): DevLink[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_LINKS));
    return SEED_LINKS;
  }
  try {
    return JSON.parse(data) as DevLink[];
  } catch {
    return SEED_LINKS;
  }
};

const saveLocalLinks = (links: DevLink[]): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(links));
};

const databaseId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const collectionId = import.meta.env.VITE_APPWRITE_BOOKMARKS_COLLECTION_ID;
const isConfigured = !!(databaseId && collectionId);

export const bookmarksService = {
  isAppwriteEnabled(userId?: string): boolean {
    return isConfigured && !!userId;
  },

  async fetchBookmarks(userId?: string): Promise<DevLink[]> {
    if (this.isAppwriteEnabled(userId)) {
      try {
        const response = await databases.listDocuments(
          databaseId,
          collectionId,
          [Query.equal("userId", userId!), Query.orderDesc("$createdAt")]
        );
        return response.documents.map((doc) => ({
          id: doc.$id,
          title: doc.title,
          url: doc.url,
          category: doc.category as any,
          description: doc.description,
          tags: doc.tags || [],
          createdAt: doc.$createdAt,
        }));
      } catch (error) {
        console.error("Failed to fetch bookmarks from Appwrite, falling back to local storage:", error);
        return getLocalLinks();
      }
    }
    return getLocalLinks();
  },

  async createBookmark(
    bookmark: Omit<DevLink, "id" | "createdAt">,
    userId?: string
  ): Promise<DevLink> {
    if (this.isAppwriteEnabled(userId)) {
      const doc = await databases.createDocument(
        databaseId,
        collectionId,
        ID.unique(),
        {
          title: bookmark.title,
          url: bookmark.url,
          category: bookmark.category,
          description: bookmark.description,
          tags: bookmark.tags,
          userId: userId!,
        }
      );
      return {
        id: doc.$id,
        title: doc.title,
        url: doc.url,
        category: doc.category as any,
        description: doc.description,
        tags: doc.tags || [],
        createdAt: doc.$createdAt,
      };
    } else {
      const localLinks = getLocalLinks();
      const newBookmark: DevLink = {
        id: `local-${crypto.randomUUID()}`,
        ...bookmark,
        createdAt: new Date().toISOString(),
      };
      saveLocalLinks([newBookmark, ...localLinks]);
      return newBookmark;
    }
  },

  async deleteBookmark(bookmarkId: string, userId?: string): Promise<void> {
    if (this.isAppwriteEnabled(userId) && !bookmarkId.startsWith("local-")) {
      await databases.deleteDocument(databaseId, collectionId, bookmarkId);
    } else {
      const localLinks = getLocalLinks();
      const updated = localLinks.filter((l) => l.id !== bookmarkId);
      saveLocalLinks(updated);
    }
  },
};

import { tablesDB } from "@/lib/appwrite";
import { Query, ID, Permission, Role } from "appwrite";
import type { Bookmark } from "../types";

const databaseId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const tableId = import.meta.env.VITE_APPWRITE_BOOKMARKS_COLLECTION_ID;

function requireAppwriteAccess(userId?: string): {
  databaseId: string;
  tableId: string;
  userId: string;
} {
  if (!userId) throw new Error("Sign in to use Bookmarks.");
  if (!databaseId || !tableId) throw new Error("Bookmarks storage is not configured.");
  return { databaseId, tableId, userId };
}

export const bookmarksService = {
  async fetchBookmarks(userId?: string): Promise<Bookmark[]> {
    const config = requireAppwriteAccess(userId);
    const response = await tablesDB.listRows({
      databaseId: config.databaseId,
      tableId: config.tableId,
      queries: [Query.equal("userId", config.userId), Query.orderDesc("$createdAt")],
    });
    return response.rows.map((row) => ({
      id: row.$id,
      title: row.title,
      url: row.url,
      category: row.category as Bookmark["category"],
      description: row.description,
      tags: row.tags || [],
      createdAt: row.$createdAt,
    }));
  },

  async createBookmark(
    bookmark: Omit<Bookmark, "id" | "createdAt">,
    userId?: string,
  ): Promise<Bookmark> {
    const config = requireAppwriteAccess(userId);
    const row = await tablesDB.createRow({
      databaseId: config.databaseId,
      tableId: config.tableId,
      rowId: ID.unique(),
      data: {
        title: bookmark.title,
        url: bookmark.url,
        category: bookmark.category,
        description: bookmark.description,
        tags: bookmark.tags,
        userId: config.userId,
      },
      permissions: [
        Permission.read(Role.user(config.userId)),
        Permission.update(Role.user(config.userId)),
        Permission.delete(Role.user(config.userId)),
      ],
    });
    return {
      id: row.$id,
      title: row.title,
      url: row.url,
      category: row.category as Bookmark["category"],
      description: row.description,
      tags: row.tags || [],
      createdAt: row.$createdAt,
    };
  },

  async deleteBookmark(bookmarkId: string, userId?: string): Promise<void> {
    const config = requireAppwriteAccess(userId);
    await tablesDB.deleteRow({
      databaseId: config.databaseId,
      tableId: config.tableId,
      rowId: bookmarkId,
    });
  },
};

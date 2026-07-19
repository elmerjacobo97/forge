import { tablesDB } from "@/lib/appwrite";
import { Query, ID, Permission, Role } from "appwrite";

export interface FeatureRow<T> {
  id: string;
  payload: T;
  createdAt: string;
}

const databaseId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const tableId = import.meta.env.VITE_APPWRITE_DATA_COLLECTION_ID;
const isConfigured = !!(databaseId && tableId);

export function isAppwriteDataEnabled(userId?: string): boolean {
  return isConfigured && !!userId;
}

export async function fetchFeatureRows<T>(
  feature: string,
  userId: string,
): Promise<FeatureRow<T>[]> {
  const response = await tablesDB.listRows({
    databaseId,
    tableId,
    queries: [
      Query.equal("userId", userId),
      Query.equal("feature", feature),
      Query.orderDesc("$createdAt"),
    ],
  });
  return response.rows.map((row) => ({
    id: row.$id,
    payload: JSON.parse(row.payload) as T,
    createdAt: row.$createdAt,
  }));
}

export async function createFeatureRow<T>(
  feature: string,
  payload: T,
  userId: string,
): Promise<FeatureRow<T>> {
  const row = await tablesDB.createRow({
    databaseId,
    tableId,
    rowId: ID.unique(),
    data: {
      userId,
      feature,
      payload: JSON.stringify(payload),
    },
    permissions: [
      Permission.read(Role.user(userId)),
      Permission.update(Role.user(userId)),
      Permission.delete(Role.user(userId)),
    ],
  });
  return {
    id: row.$id,
    payload: JSON.parse(row.payload) as T,
    createdAt: row.$createdAt,
  };
}

export async function updateFeatureRow<T>(
  id: string,
  payload: T,
): Promise<FeatureRow<T>> {
  const row = await tablesDB.updateRow({
    databaseId,
    tableId,
    rowId: id,
    data: {
      payload: JSON.stringify(payload),
    },
  });
  return {
    id: row.$id,
    payload: JSON.parse(row.payload) as T,
    createdAt: row.$createdAt,
  };
}

export async function deleteFeatureRow(id: string): Promise<void> {
  await tablesDB.deleteRow({ databaseId, tableId, rowId: id });
}

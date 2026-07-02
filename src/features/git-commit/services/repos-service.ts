import { load, Store } from "@tauri-apps/plugin-store";
import { REPO_STORE_KEY, REPOS_STORE_KEY } from "../types";
import type { SavedRepo } from "../types";

const STORE_FILE = "forge-settings.json";

let storePromise: Promise<Store> | null = null;

function getStore(): Promise<Store> {
  if (!storePromise) {
    storePromise = load(STORE_FILE);
  }
  return storePromise;
}

function sortByRecent(repos: SavedRepo[]): SavedRepo[] {
  return [...repos].sort((a, b) => b.lastOpenedAt - a.lastOpenedAt);
}

function nameFromPath(path: string): string {
  return path.split("/").filter(Boolean).pop() ?? path;
}

/** One-time migration from the old single-repo key so existing users don't lose their repo. */
async function migrateLegacyRepo(store: Store): Promise<SavedRepo[]> {
  const legacyPath = await store.get<string>(REPO_STORE_KEY);
  if (!legacyPath) return [];
  const migrated: SavedRepo[] = [
    {
      id: crypto.randomUUID(),
      path: legacyPath,
      name: nameFromPath(legacyPath),
      lastOpenedAt: Date.now(),
    },
  ];
  await store.set(REPOS_STORE_KEY, migrated);
  await store.save();
  return migrated;
}

export const reposService = {
  async list(): Promise<SavedRepo[]> {
    const store = await getStore();
    const repos = await store.get<SavedRepo[]>(REPOS_STORE_KEY);
    if (!repos || repos.length === 0) {
      return sortByRecent(await migrateLegacyRepo(store));
    }
    return sortByRecent(repos);
  },

  async add(path: string): Promise<SavedRepo[]> {
    const store = await getStore();
    const repos = (await store.get<SavedRepo[]>(REPOS_STORE_KEY)) ?? [];
    const existing = repos.find((r) => r.path === path);
    const next = existing
      ? repos.map((r) => (r.path === path ? { ...r, lastOpenedAt: Date.now() } : r))
      : [
          ...repos,
          {
            id: crypto.randomUUID(),
            path,
            name: nameFromPath(path),
            lastOpenedAt: Date.now(),
          },
        ];
    await store.set(REPOS_STORE_KEY, next);
    await store.save();
    return sortByRecent(next);
  },

  async remove(id: string): Promise<SavedRepo[]> {
    const store = await getStore();
    const repos = (await store.get<SavedRepo[]>(REPOS_STORE_KEY)) ?? [];
    const next = repos.filter((r) => r.id !== id);
    await store.set(REPOS_STORE_KEY, next);
    await store.save();
    return sortByRecent(next);
  },

  async touch(id: string): Promise<SavedRepo[]> {
    const store = await getStore();
    const repos = (await store.get<SavedRepo[]>(REPOS_STORE_KEY)) ?? [];
    const next = repos.map((r) => (r.id === id ? { ...r, lastOpenedAt: Date.now() } : r));
    await store.set(REPOS_STORE_KEY, next);
    await store.save();
    return sortByRecent(next);
  },
};

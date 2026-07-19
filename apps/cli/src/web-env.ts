import { readFile } from "node:fs/promises"
import { dirname, join } from "node:path"

export type WebEnvConfig = {
  endpoint?: string
  projectId?: string
  databaseId?: string
  bookmarksTableId?: string
  devBoardProjectsTableId?: string
  devBoardTicketsTableId?: string
  devBoardEventsTableId?: string
  devBoardTimeEntriesTableId?: string
  envPath: string
}

function parseEnvFile(contents: string): Record<string, string> {
  const values: Record<string, string> = {}
  for (const line of contents.split("\n")) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue
    const eq = trimmed.indexOf("=")
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    values[key] = value
  }
  return values
}

/** Walk up from startDir looking for apps/web/.env */
export async function findWebEnvPath(
  startDir: string = process.cwd(),
): Promise<string | null> {
  let dir = startDir
  for (let i = 0; i < 8; i++) {
    const candidate = join(dir, "apps", "web", ".env")
    try {
      await readFile(candidate, "utf8")
      return candidate
    } catch {
      // continue
    }
    const parent = dirname(dir)
    if (parent === dir) break
    dir = parent
  }
  return null
}

export async function loadConfigFromWebEnv(
  envPath?: string,
): Promise<WebEnvConfig | null> {
  const path = envPath ?? (await findWebEnvPath())
  if (!path) return null

  const raw = await readFile(path, "utf8")
  const env = parseEnvFile(raw)

  return {
    endpoint: emptyToUndefined(env.VITE_APPWRITE_ENDPOINT),
    projectId: emptyToUndefined(env.VITE_APPWRITE_PROJECT_ID),
    databaseId: emptyToUndefined(env.VITE_APPWRITE_DATABASE_ID),
    bookmarksTableId: emptyToUndefined(env.VITE_APPWRITE_BOOKMARKS_COLLECTION_ID),
    devBoardProjectsTableId: emptyToUndefined(
      env.VITE_APPWRITE_DEV_BOARD_PROJECTS_TABLE_ID,
    ),
    devBoardTicketsTableId: emptyToUndefined(
      env.VITE_APPWRITE_DEV_BOARD_TICKETS_TABLE_ID,
    ),
    devBoardEventsTableId: emptyToUndefined(
      env.VITE_APPWRITE_DEV_BOARD_EVENTS_TABLE_ID,
    ),
    devBoardTimeEntriesTableId: emptyToUndefined(
      env.VITE_APPWRITE_DEV_BOARD_TIME_ENTRIES_TABLE_ID,
    ),
    envPath: path,
  }
}

function emptyToUndefined(value: string | undefined): string | undefined {
  if (value == null || value.trim() === "") return undefined
  return value.trim()
}

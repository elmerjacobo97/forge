import { mkdir, readFile, writeFile } from "node:fs/promises"
import { homedir } from "node:os"
import { join } from "node:path"
import type { ForgeConfig } from "./types.js"

const FORGE_DIR = join(homedir(), ".forge")
const CONFIG_PATH = join(FORGE_DIR, "config.json")

export function getForgeDir(): string {
  return FORGE_DIR
}

export function getConfigPath(): string {
  return CONFIG_PATH
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0
}

export function parseConfig(value: unknown): ForgeConfig {
  if (typeof value !== "object" || value === null) {
    throw new Error("Invalid config: expected an object.")
  }

  const record = value as Record<string, unknown>
  const endpoint = record.endpoint
  const projectId = record.projectId
  const databaseId = record.databaseId
  const bookmarksTableId = record.bookmarksTableId

  if (
    !isNonEmptyString(endpoint) ||
    !isNonEmptyString(projectId) ||
    !isNonEmptyString(databaseId) ||
    !isNonEmptyString(bookmarksTableId)
  ) {
    throw new Error(
      "Invalid config: endpoint, projectId, databaseId, and bookmarksTableId are required.",
    )
  }

  return {
    endpoint: endpoint.trim(),
    projectId: projectId.trim(),
    databaseId: databaseId.trim(),
    bookmarksTableId: bookmarksTableId.trim(),
  }
}

export async function ensureForgeDir(): Promise<string> {
  await mkdir(FORGE_DIR, { recursive: true, mode: 0o700 })
  return FORGE_DIR
}

export async function readConfig(): Promise<ForgeConfig | null> {
  try {
    const raw = await readFile(CONFIG_PATH, "utf8")
    return parseConfig(JSON.parse(raw) as unknown)
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code: unknown }).code === "ENOENT"
    ) {
      return null
    }
    throw error
  }
}

export async function writeConfig(config: ForgeConfig): Promise<string> {
  const parsed = parseConfig(config)
  await ensureForgeDir()
  await writeFile(CONFIG_PATH, `${JSON.stringify(parsed, null, 2)}\n`, {
    encoding: "utf8",
    mode: 0o600,
  })
  return CONFIG_PATH
}

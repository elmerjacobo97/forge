import { readFile, unlink, writeFile } from "node:fs/promises"
import { join } from "node:path"
import { ensureForgeDir, getForgeDir } from "./config.js"
import type { ForgeSession } from "./types.js"

const SESSION_PATH = join(getForgeDir(), "session.json")

export function getSessionPath(): string {
  return SESSION_PATH
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0
}

export function parseSession(value: unknown): ForgeSession {
  if (typeof value !== "object" || value === null) {
    throw new Error("Invalid session: expected an object.")
  }

  const record = value as Record<string, unknown>
  const userId = record.userId
  const sessionSecret = record.sessionSecret

  if (!isNonEmptyString(userId) || !isNonEmptyString(sessionSecret)) {
    throw new Error("Invalid session: userId and sessionSecret are required.")
  }

  return {
    userId: userId.trim(),
    sessionSecret: sessionSecret.trim(),
  }
}

export async function readSession(): Promise<ForgeSession | null> {
  try {
    const raw = await readFile(SESSION_PATH, "utf8")
    return parseSession(JSON.parse(raw) as unknown)
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

export async function writeSession(session: ForgeSession): Promise<string> {
  const parsed = parseSession(session)
  await ensureForgeDir()
  await writeFile(SESSION_PATH, `${JSON.stringify(parsed, null, 2)}\n`, {
    encoding: "utf8",
    mode: 0o600,
  })
  return SESSION_PATH
}

export async function clearSession(): Promise<void> {
  try {
    await unlink(SESSION_PATH)
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code: unknown }).code === "ENOENT"
    ) {
      return
    }
    throw error
  }
}

import { readFile } from "node:fs/promises"
import { dirname, join } from "node:path"

export type WebEnvConfig = {
  url?: string
  anonKey?: string
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

/** Walk up from startDir looking for the web app's local environment. */
export async function findWebEnvPath(
  startDir: string = process.cwd(),
): Promise<string | null> {
  let dir = startDir
  for (let i = 0; i < 8; i++) {
    for (const filename of [".env.local", ".env"]) {
      const candidate = join(dir, "apps", "web", filename)
      try {
        await readFile(candidate, "utf8")
        return candidate
      } catch {
        // continue
      }
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
    url: emptyToUndefined(
      env.NEXT_PUBLIC_INSFORGE_URL ?? env.VITE_INSFORGE_URL,
    ),
    anonKey: emptyToUndefined(
      env.NEXT_PUBLIC_INSFORGE_ANON_KEY ?? env.VITE_INSFORGE_ANON_KEY,
    ),
    envPath: path,
  }
}

function emptyToUndefined(value: string | undefined): string | undefined {
  if (value == null || value.trim() === "") return undefined
  return value.trim()
}

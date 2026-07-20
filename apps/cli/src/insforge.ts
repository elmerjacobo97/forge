import {
  createClient as createSdkClient,
  type InsForgeClient,
} from "@insforge/sdk"
import { createBookmarksService } from "./bookmarks-service.js"
import { readConfig } from "./config.js"
import { createDevBoardService } from "./dev-board-service.js"
import { createProjectsService } from "./projects-service.js"
import { readSession, writeSession } from "./session.js"
import type { ForgeConfig, ForgeSession } from "./types.js"

function asRecord(value: unknown, context: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null) {
    throw new Error(`${context} returned an invalid response.`)
  }
  return value as Record<string, unknown>
}

function requiredString(
  record: Record<string, unknown>,
  key: string,
  context: string,
): string {
  const value = record[key]
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`${context} response is missing ${key}.`)
  }
  return value
}

function parseAuthSession(
  value: unknown,
  context: string,
  fallbackRefreshToken?: string,
): ForgeSession {
  const record = asRecord(value, context)
  const user = asRecord(record.user, context)
  return {
    userId: requiredString(user, "id", context),
    accessToken: requiredString(record, "accessToken", context),
    refreshToken:
      typeof record.refreshToken === "string" && record.refreshToken.length > 0
        ? record.refreshToken
        : fallbackRefreshToken ??
          requiredString(record, "refreshToken", context),
  }
}

export async function requireConfig(): Promise<ForgeConfig> {
  const config = await readConfig()
  if (!config) {
    throw new Error(
      "No config found. Run: forge-cli init --from-web-env  (or forge-cli init)",
    )
  }
  return config
}

export async function requireSession(): Promise<ForgeSession> {
  const session = await readSession()
  if (!session) throw new Error("Not logged in. Run: forge-cli login")
  return session
}

export function createClient(
  config: ForgeConfig,
  accessToken?: string,
): InsForgeClient {
  return createSdkClient({
    baseUrl: config.url,
    anonKey: config.anonKey,
    accessToken,
    isServerMode: true,
  })
}

export async function createAuthedClient(): Promise<{
  config: ForgeConfig
  session: ForgeSession
  client: InsForgeClient
}> {
  const config = await requireConfig()
  const currentSession = await requireSession()
  const refreshClient = createClient(config)
  const { data, error } = await refreshClient.auth.refreshSession({
    refreshToken: currentSession.refreshToken,
  })
  if (error) throw new Error(error.message)

  const session = parseAuthSession(
    data as unknown,
    "Session refresh",
    currentSession.refreshToken,
  )
  await writeSession(session)
  return { config, session, client: createClient(config, session.accessToken) }
}

export async function createAuthedBookmarksService() {
  const { client } = await createAuthedClient()
  return createBookmarksService({ client })
}

export async function createAuthedDevBoardService() {
  const { client } = await createAuthedClient()
  return createDevBoardService({ client })
}

export async function createAuthedProjectsService() {
  const { client } = await createAuthedClient()
  return createProjectsService({ client })
}

export async function createEmailPasswordSession(params: {
  config: ForgeConfig
  email: string
  password: string
}): Promise<ForgeSession> {
  const client = createClient(params.config)
  const { data, error } = await client.auth.signInWithPassword({
    email: params.email,
    password: params.password,
  })
  if (error) throw new Error(error.message)
  return parseAuthSession(data as unknown, "Login")
}

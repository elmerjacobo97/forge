import { Account, Client, TablesDB } from "node-appwrite"
import { createBookmarksService } from "./bookmarks-service.js"
import { readConfig } from "./config.js"
import { readSession } from "./session.js"
import type { ForgeConfig, ForgeSession } from "./types.js"

export async function requireConfig(): Promise<ForgeConfig> {
  const config = await readConfig()
  if (!config) {
    throw new Error(
      "No config found. Run: forge-cli init --endpoint … --project-id … --database-id … --bookmarks-table-id …",
    )
  }
  return config
}

export async function requireSession(): Promise<ForgeSession> {
  const session = await readSession()
  if (!session) {
    throw new Error("Not logged in. Run: forge-cli login")
  }
  return session
}

export function createClient(
  config: ForgeConfig,
  sessionSecret?: string,
): Client {
  const client = new Client()
    .setEndpoint(config.endpoint)
    .setProject(config.projectId)

  if (sessionSecret) {
    client.setSession(sessionSecret)
  }

  return client
}

export async function createAuthedClient(): Promise<{
  config: ForgeConfig
  session: ForgeSession
  client: Client
  account: Account
  tablesDB: TablesDB
}> {
  const config = await requireConfig()
  const session = await requireSession()
  const client = createClient(config, session.sessionSecret)
  return {
    config,
    session,
    client,
    account: new Account(client),
    tablesDB: new TablesDB(client),
  }
}

export async function createAuthedBookmarksService() {
  const { config, session, tablesDB } = await createAuthedClient()
  return createBookmarksService({
    tablesDB,
    config,
    userId: session.userId,
  })
}

/**
 * Appwrite only returns Models.Session.secret when the request uses an API key.
 * For the CLI (no API key), we create the session via HTTP and read the
 * `a_session_<projectId>` cookie — that value is what `Client.setSession` expects.
 */
export async function createEmailPasswordSession(params: {
  config: ForgeConfig
  email: string
  password: string
}): Promise<{ userId: string; sessionSecret: string }> {
  const { config, email, password } = params
  const endpoint = config.endpoint.replace(/\/+$/, "")
  const url = `${endpoint}/account/sessions/email`

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Appwrite-Project": config.projectId,
    },
    body: JSON.stringify({ email, password }),
  })

  const bodyText = await response.text()
  let body: unknown = null
  if (bodyText) {
    try {
      body = JSON.parse(bodyText) as unknown
    } catch {
      body = bodyText
    }
  }

  if (!response.ok) {
    const message = extractAppwriteError(body) ?? `Login failed (${response.status}).`
    throw new Error(message)
  }

  const sessionSecret = extractSessionSecret(response, config.projectId)
  if (!sessionSecret) {
    throw new Error(
      "Login succeeded but no session cookie was returned. " +
        "Check that the Appwrite project allows API clients (not only web platforms).",
    )
  }

  const userId = extractUserId(body)
  if (!userId) {
    throw new Error("Login succeeded but response did not include userId.")
  }

  return { userId, sessionSecret }
}

function extractAppwriteError(body: unknown): string | null {
  if (typeof body !== "object" || body === null) return null
  const message = (body as { message?: unknown }).message
  return typeof message === "string" && message.length > 0 ? message : null
}

function extractUserId(body: unknown): string | null {
  if (typeof body !== "object" || body === null) return null
  const userId = (body as { userId?: unknown }).userId
  return typeof userId === "string" && userId.length > 0 ? userId : null
}

function extractSessionSecret(
  response: Response,
  projectId: string,
): string | null {
  const cookieName = `a_session_${projectId}`
  const getSetCookie = (
    response.headers as Headers & { getSetCookie?: () => string[] }
  ).getSetCookie

  const setCookies =
    typeof getSetCookie === "function" ? getSetCookie.call(response.headers) : []

  if (setCookies.length > 0) {
    for (const header of setCookies) {
      const secret = parseCookieValue(header, cookieName)
      if (secret) return secret
    }
  }

  const combined = response.headers.get("set-cookie")
  if (combined) {
    return parseCookieValue(combined, cookieName)
  }

  return null
}

function parseCookieValue(setCookieHeader: string, cookieName: string): string | null {
  // Headers may contain multiple cookies joined by comma; match name=value
  const match = setCookieHeader.match(
    new RegExp(`(?:^|[,\\s])${escapeRegExp(cookieName)}=([^;\\s,]+)`),
  )
  return match?.[1] ?? null
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

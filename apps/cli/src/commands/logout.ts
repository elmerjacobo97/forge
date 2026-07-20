import { createClient, requireConfig } from "../insforge.js"
import { clearSession, readSession } from "../session.js"

const LOGOUT_HELP = `Usage:
  forge-cli logout

Invalidates the current InsForge session (when possible) and removes ~/.forge/session.json.

Options:
  --help    Show this help
`

export async function runLogout(args: string[]): Promise<void> {
  if (args.includes("--help") || args.includes("-h")) {
    process.stdout.write(`${LOGOUT_HELP}\n`)
    return
  }

  const session = await readSession()
  if (!session) {
    process.stdout.write("Already logged out.\n")
    return
  }

  try {
    const config = await requireConfig()
    const client = createClient(config, session.accessToken)
    await client.auth.signOut()
  } catch {
    // Still clear local session if remote delete fails (expired/network).
  }

  await clearSession()
  process.stdout.write("Logged out.\n")
}

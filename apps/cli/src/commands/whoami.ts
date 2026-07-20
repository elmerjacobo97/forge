import { createAuthedClient } from "../insforge.js"
import { asRecord, stringField, throwIfError } from "../insforge-data.js"

const WHOAMI_HELP = `Usage:
  forge-cli whoami

Shows the currently authenticated InsForge user.

Options:
  --help    Show this help
`

export async function runWhoami(args: string[]): Promise<void> {
  if (args.includes("--help") || args.includes("-h")) {
    process.stdout.write(`${WHOAMI_HELP}\n`)
    return
  }

  const { client } = await createAuthedClient()
  const response = await client.auth.getCurrentUser()
  throwIfError(response.error, "Failed to get current user.")
  const data = asRecord(response.data as unknown, "current user response")
  const user = asRecord(data.user, "current user")
  const id = stringField(user, "id", "current user")
  const email = stringField(user, "email", "current user")
  const profile =
    user.profile === null
      ? null
      : asRecord(user.profile, "current user profile")
  const name = profile?.name
  if (name !== undefined && typeof name !== "string") {
    throw new Error("Invalid current user profile: name must be a string.")
  }

  process.stdout.write(
    `id:    ${id}\n` +
      `email: ${email}\n` +
      `name:  ${name || "(none)"}\n`,
  )
}

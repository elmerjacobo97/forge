import { createAuthedClient } from "../appwrite.js"

const WHOAMI_HELP = `Usage:
  forge-cli whoami

Shows the currently authenticated Appwrite user.

Options:
  --help    Show this help
`

export async function runWhoami(args: string[]): Promise<void> {
  if (args.includes("--help") || args.includes("-h")) {
    process.stdout.write(`${WHOAMI_HELP}\n`)
    return
  }

  const { account } = await createAuthedClient()
  const user = await account.get()

  process.stdout.write(
    `id:    ${user.$id}\n` +
      `email: ${user.email}\n` +
      `name:  ${user.name || "(none)"}\n`,
  )
}

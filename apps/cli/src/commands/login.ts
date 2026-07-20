import { createEmailPasswordSession, requireConfig } from "../insforge.js"
import { getFlagValue, promptSecret, promptText } from "../flags.js"
import { writeSession } from "../session.js"

const LOGIN_HELP = `Usage:
  forge-cli login [--email <email>] [--password <password>]

Options:
  --email <email>         Account email
  --password <password>   Account password (prefer interactive prompt)
  --help                  Show this help
`

export async function runLogin(args: string[]): Promise<void> {
  if (args.includes("--help") || args.includes("-h")) {
    process.stdout.write(`${LOGIN_HELP}\n`)
    return
  }

  const config = await requireConfig()

  let email = getFlagValue(args, "--email")
  let password = getFlagValue(args, "--password")

  if (!email) {
    email = await promptText("Email: ")
  }
  if (!password) {
    password = await promptSecret("Password: ")
  }

  if (!email || !password) {
    process.stderr.write(`Email and password are required.\n\n${LOGIN_HELP}\n`)
    process.exitCode = 1
    return
  }

  const session = await createEmailPasswordSession({
    config,
    email,
    password,
  })

  const path = await writeSession(session)
  process.stdout.write(`Logged in as ${session.userId}\nSession saved to ${path}\n`)
}

import { runBookmark } from "./commands/bookmark.js"
import { runInit } from "./commands/init.js"
import { runLogin } from "./commands/login.js"
import { runLogout } from "./commands/logout.js"
import { runProject } from "./commands/project.js"
import { runTicket } from "./commands/ticket.js"
import { runWhoami } from "./commands/whoami.js"

const HELP = `forge-cli — Forge CLI

Usage:
  forge-cli --help
  forge-cli <command>

Commands:
  init      Write Appwrite config to ~/.forge/config.json
  login     Sign in with email/password
  logout    Sign out and clear local session
  whoami    Show the authenticated user
  bookmark  Manage bookmarks (create|list|get|update|delete)
  project   Manage Dev Board projects (create|list|get|update|delete)
  ticket    Manage Dev Board tickets (create|list|get|update|delete|move)

Options:
  --help    Show this help
`

async function main(argv: string[]): Promise<void> {
  let args = argv.slice(2)
  // pnpm run sometimes forwards a literal "--" before the command args
  if (args[0] === "--") args = args.slice(1)

  if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
    process.stdout.write(`${HELP}\n`)
    return
  }

  const [command, ...rest] = args

  switch (command) {
    case "init":
      await runInit(rest)
      return
    case "login":
      await runLogin(rest)
      return
    case "logout":
      await runLogout(rest)
      return
    case "whoami":
      await runWhoami(rest)
      return
    case "bookmark":
      await runBookmark(rest)
      return
    case "project":
      await runProject(rest)
      return
    case "ticket":
      await runTicket(rest)
      return
    default:
      process.stderr.write(`Unknown command: ${command}\n\n${HELP}\n`)
      process.exitCode = 1
  }
}

main(process.argv).catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error)
  process.stderr.write(`Error: ${message}\n`)
  process.exitCode = 1
})

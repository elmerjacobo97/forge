import { runInit } from "./commands/init.js"

const HELP = `forge — Forge CLI

Usage:
  forge --help
  forge <command>

Commands:
  init    Write Appwrite config to ~/.forge/config.json

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

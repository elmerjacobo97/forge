const HELP = `forge — Forge CLI

Usage:
  forge --help
  forge <command>

Commands:
  (coming soon)

Options:
  --help    Show this help
`

function main(argv: string[]): void {
  const args = argv.slice(2)

  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    process.stdout.write(`${HELP}\n`)
    return
  }

  const unknown = args[0]
  process.stderr.write(`Unknown command: ${unknown}\n\n${HELP}\n`)
  process.exitCode = 1
}

main(process.argv)

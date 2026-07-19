import { writeConfig } from "../config.js"
import type { ForgeConfig } from "../types.js"

const INIT_HELP = `Usage:
  forge init --endpoint <url> --project-id <id> --database-id <id> --bookmarks-table-id <id>

Options:
  --endpoint <url>              Appwrite endpoint (e.g. https://cloud.appwrite.io/v1)
  --project-id <id>             Appwrite project ID
  --database-id <id>            Appwrite database ID
  --bookmarks-table-id <id>     Bookmarks table/collection ID
  --help                        Show this help
`

function getFlagValue(args: string[], name: string): string | undefined {
  const index = args.indexOf(name)
  if (index === -1) return undefined
  const value = args[index + 1]
  if (!value || value.startsWith("--")) return undefined
  return value
}

function parseInitFlags(args: string[]): ForgeConfig | { missing: string[] } {
  const endpoint = getFlagValue(args, "--endpoint")
  const projectId = getFlagValue(args, "--project-id")
  const databaseId = getFlagValue(args, "--database-id")
  const bookmarksTableId = getFlagValue(args, "--bookmarks-table-id")

  if (!endpoint || !projectId || !databaseId || !bookmarksTableId) {
    const missing: string[] = []
    if (!endpoint) missing.push("--endpoint")
    if (!projectId) missing.push("--project-id")
    if (!databaseId) missing.push("--database-id")
    if (!bookmarksTableId) missing.push("--bookmarks-table-id")
    return { missing }
  }

  return {
    endpoint,
    projectId,
    databaseId,
    bookmarksTableId,
  }
}

export async function runInit(args: string[]): Promise<void> {
  if (args.includes("--help") || args.includes("-h")) {
    process.stdout.write(`${INIT_HELP}\n`)
    return
  }

  const parsed = parseInitFlags(args)
  if ("missing" in parsed) {
    process.stderr.write(
      `Missing required flags: ${parsed.missing.join(", ")}\n\n${INIT_HELP}\n`,
    )
    process.exitCode = 1
    return
  }

  const path = await writeConfig(parsed)
  process.stdout.write(
    `Wrote config to ${path}\n` +
      `  endpoint: ${parsed.endpoint}\n` +
      `  projectId: ${parsed.projectId}\n` +
      `  databaseId: ${parsed.databaseId}\n` +
      `  bookmarksTableId: ${parsed.bookmarksTableId}\n`,
  )
}

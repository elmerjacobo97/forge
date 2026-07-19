import { writeConfig } from "../config.js"
import { getFlagValue, hasFlag, promptText } from "../flags.js"
import type { ForgeConfig } from "../types.js"
import { loadConfigFromWebEnv } from "../web-env.js"

const INIT_HELP = `Usage:
  forge-cli init
  forge-cli init --from-web-env
  forge-cli init --endpoint <url> --project-id <id> --database-id <id> --bookmarks-table-id <id>

With no flags, prompts interactively. If apps/web/.env is found in the monorepo,
values are offered as defaults (press Enter to accept).

Options:
  --from-web-env                Read IDs from apps/web/.env (no prompts if complete)
  --endpoint <url>              Appwrite endpoint
  --project-id <id>             Appwrite project ID
  --database-id <id>            Appwrite database ID
  --bookmarks-table-id <id>     Bookmarks table/collection ID
  --help                        Show this help
`

async function promptWithDefault(
  label: string,
  fallback?: string,
): Promise<string> {
  const suffix = fallback ? ` [${fallback}]` : ""
  const answer = await promptText(`${label}${suffix}: `)
  return (answer || fallback || "").trim()
}

export async function runInit(args: string[]): Promise<void> {
  if (args.includes("--help") || args.includes("-h")) {
    process.stdout.write(`${INIT_HELP}\n`)
    return
  }

  const fromWebEnv = hasFlag(args, "--from-web-env")
  const webEnv = await loadConfigFromWebEnv()

  let endpoint = getFlagValue(args, "--endpoint") ?? webEnv?.endpoint
  let projectId = getFlagValue(args, "--project-id") ?? webEnv?.projectId
  let databaseId = getFlagValue(args, "--database-id") ?? webEnv?.databaseId
  let bookmarksTableId =
    getFlagValue(args, "--bookmarks-table-id") ?? webEnv?.bookmarksTableId

  const flagsComplete = !!(
    getFlagValue(args, "--endpoint") &&
    getFlagValue(args, "--project-id") &&
    getFlagValue(args, "--database-id") &&
    getFlagValue(args, "--bookmarks-table-id")
  )

  if (fromWebEnv) {
    if (webEnv) {
      process.stdout.write(`Loaded defaults from ${webEnv.envPath}\n`)
    } else {
      process.stderr.write(
        "Could not find apps/web/.env. Run from the forge monorepo, or pass flags.\n",
      )
      process.exitCode = 1
      return
    }
  }

  const needsPrompt =
    !flagsComplete &&
    (!fromWebEnv || !endpoint || !projectId || !databaseId || !bookmarksTableId)

  if (needsPrompt) {
    if (webEnv && !fromWebEnv) {
      process.stdout.write(
        `Found ${webEnv.envPath} — press Enter to accept defaults.\n\n`,
      )
    } else if (!webEnv) {
      process.stdout.write(
        "No apps/web/.env found. Enter Appwrite values (same as the web app).\n\n",
      )
    }

    endpoint = await promptWithDefault("Endpoint", endpoint)
    projectId = await promptWithDefault("Project ID", projectId)
    databaseId = await promptWithDefault("Database ID", databaseId)
    bookmarksTableId = await promptWithDefault(
      "Bookmarks table ID",
      bookmarksTableId,
    )
  }

  if (!endpoint || !projectId || !databaseId || !bookmarksTableId) {
    process.stderr.write(
      "endpoint, projectId, databaseId, and bookmarksTableId are all required.\n" +
        "Tip: from the repo root, run  forge-cli init --from-web-env\n" +
        "     (uses apps/web/.env) or  forge-cli init  (interactive)\n",
    )
    process.exitCode = 1
    return
  }

  const config: ForgeConfig = {
    endpoint,
    projectId,
    databaseId,
    bookmarksTableId,
  }

  const path = await writeConfig(config)
  process.stdout.write(
    `Wrote config to ${path}\n` +
      `  endpoint: ${config.endpoint}\n` +
      `  projectId: ${config.projectId}\n` +
      `  databaseId: ${config.databaseId}\n` +
      `  bookmarksTableId: ${config.bookmarksTableId}\n\n` +
      `Next: forge-cli login\n`,
  )
}

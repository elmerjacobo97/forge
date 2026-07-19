import { writeConfig } from "../config.js"
import { getFlagValue, hasFlag, promptText } from "../flags.js"
import type { ForgeConfig } from "../types.js"
import { loadConfigFromWebEnv } from "../web-env.js"

const INIT_HELP = `Usage:
  forge-cli init
  forge-cli init --from-web-env
  forge-cli init --endpoint <url> --project-id <id> --database-id <id> \\
    --bookmarks-table-id <id> --dev-board-projects-table-id <id> \\
    --dev-board-tickets-table-id <id> --dev-board-events-table-id <id> \\
    --dev-board-time-entries-table-id <id>

With no flags, prompts interactively. If apps/web/.env is found in the monorepo,
values are offered as defaults (press Enter to accept).

Options:
  --from-web-env                          Read IDs from apps/web/.env (no prompts if complete)
  --endpoint <url>                        Appwrite endpoint
  --project-id <id>                       Appwrite project ID
  --database-id <id>                      Appwrite database ID
  --bookmarks-table-id <id>               Bookmarks table/collection ID
  --dev-board-projects-table-id <id>      Dev Board projects table ID
  --dev-board-tickets-table-id <id>       Dev Board tickets table ID
  --dev-board-events-table-id <id>        Dev Board events table ID
  --dev-board-time-entries-table-id <id>  Dev Board time entries table ID
  --help                                  Show this help
`

async function promptWithDefault(
  label: string,
  fallback?: string,
): Promise<string> {
  const suffix = fallback ? ` [${fallback}]` : ""
  const answer = await promptText(`${label}${suffix}: `)
  return (answer || fallback || "").trim()
}

function isConfigComplete(
  endpoint: string | undefined,
  projectId: string | undefined,
  databaseId: string | undefined,
  bookmarksTableId: string | undefined,
  devBoardProjectsTableId: string | undefined,
  devBoardTicketsTableId: string | undefined,
  devBoardEventsTableId: string | undefined,
  devBoardTimeEntriesTableId: string | undefined,
): boolean {
  return !!(
    endpoint &&
    projectId &&
    databaseId &&
    bookmarksTableId &&
    devBoardProjectsTableId &&
    devBoardTicketsTableId &&
    devBoardEventsTableId &&
    devBoardTimeEntriesTableId
  )
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
  let devBoardProjectsTableId =
    getFlagValue(args, "--dev-board-projects-table-id") ??
    webEnv?.devBoardProjectsTableId
  let devBoardTicketsTableId =
    getFlagValue(args, "--dev-board-tickets-table-id") ??
    webEnv?.devBoardTicketsTableId
  let devBoardEventsTableId =
    getFlagValue(args, "--dev-board-events-table-id") ??
    webEnv?.devBoardEventsTableId
  let devBoardTimeEntriesTableId =
    getFlagValue(args, "--dev-board-time-entries-table-id") ??
    webEnv?.devBoardTimeEntriesTableId

  const flagsComplete = isConfigComplete(
    getFlagValue(args, "--endpoint"),
    getFlagValue(args, "--project-id"),
    getFlagValue(args, "--database-id"),
    getFlagValue(args, "--bookmarks-table-id"),
    getFlagValue(args, "--dev-board-projects-table-id"),
    getFlagValue(args, "--dev-board-tickets-table-id"),
    getFlagValue(args, "--dev-board-events-table-id"),
    getFlagValue(args, "--dev-board-time-entries-table-id"),
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
    (!fromWebEnv ||
      !isConfigComplete(
        endpoint,
        projectId,
        databaseId,
        bookmarksTableId,
        devBoardProjectsTableId,
        devBoardTicketsTableId,
        devBoardEventsTableId,
        devBoardTimeEntriesTableId,
      ))

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
    devBoardProjectsTableId = await promptWithDefault(
      "Dev Board projects table ID",
      devBoardProjectsTableId,
    )
    devBoardTicketsTableId = await promptWithDefault(
      "Dev Board tickets table ID",
      devBoardTicketsTableId,
    )
    devBoardEventsTableId = await promptWithDefault(
      "Dev Board events table ID",
      devBoardEventsTableId,
    )
    devBoardTimeEntriesTableId = await promptWithDefault(
      "Dev Board time entries table ID",
      devBoardTimeEntriesTableId,
    )
  }

  if (
    !endpoint ||
    !projectId ||
    !databaseId ||
    !bookmarksTableId ||
    !devBoardProjectsTableId ||
    !devBoardTicketsTableId ||
    !devBoardEventsTableId ||
    !devBoardTimeEntriesTableId
  ) {
    process.stderr.write(
      "endpoint, projectId, databaseId, bookmarksTableId, " +
        "devBoardProjectsTableId, devBoardTicketsTableId, " +
        "devBoardEventsTableId, and " +
        "devBoardTimeEntriesTableId are all required.\n" +
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
    devBoardProjectsTableId,
    devBoardTicketsTableId,
    devBoardEventsTableId,
    devBoardTimeEntriesTableId,
  }

  const path = await writeConfig(config)
  process.stdout.write(
    `Wrote config to ${path}\n` +
      `  endpoint: ${config.endpoint}\n` +
      `  projectId: ${config.projectId}\n` +
      `  databaseId: ${config.databaseId}\n` +
      `  bookmarksTableId: ${config.bookmarksTableId}\n` +
      `  devBoardProjectsTableId: ${config.devBoardProjectsTableId}\n` +
      `  devBoardTicketsTableId: ${config.devBoardTicketsTableId}\n` +
      `  devBoardEventsTableId: ${config.devBoardEventsTableId}\n` +
      `  devBoardTimeEntriesTableId: ${config.devBoardTimeEntriesTableId}\n\n` +
      `Next: forge-cli login\n`,
  )
}

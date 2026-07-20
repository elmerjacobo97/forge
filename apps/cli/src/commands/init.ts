import { writeConfig } from "../config.js"
import { getFlagValue, hasFlag, promptSecret, promptText } from "../flags.js"
import type { ForgeConfig } from "../types.js"
import { loadConfigFromWebEnv } from "../web-env.js"

const INIT_HELP = `Usage:
  forge-cli init
  forge-cli init --from-web-env
  forge-cli init --url <url> --anon-key <key>

With no flags, prompts interactively. If apps/web/.env.local or apps/web/.env is
found in the monorepo, values are offered as defaults (press Enter to accept).

Options:
  --from-web-env       Read InsForge values from apps/web environment
  --url <url>          InsForge backend URL (--endpoint remains an alias)
  --anon-key <key>     InsForge anonymous key
  --help               Show this help
`

async function promptWithDefault(
  label: string,
  fallback?: string,
  secret = false,
): Promise<string> {
  const suffix = fallback ? " [configured]" : ""
  const answer = secret
    ? await promptSecret(`${label}${suffix}: `)
    : await promptText(`${label}${fallback ? ` [${fallback}]` : ""}: `)
  return (answer || fallback || "").trim()
}

export async function runInit(args: string[]): Promise<void> {
  if (args.includes("--help") || args.includes("-h")) {
    process.stdout.write(`${INIT_HELP}\n`)
    return
  }

  const fromWebEnv = hasFlag(args, "--from-web-env")
  const webEnv = await loadConfigFromWebEnv()
  let url =
    getFlagValue(args, "--url") ??
    getFlagValue(args, "--endpoint") ??
    webEnv?.url
  let anonKey = getFlagValue(args, "--anon-key") ?? webEnv?.anonKey
  const flagsComplete = Boolean(
    (getFlagValue(args, "--url") ?? getFlagValue(args, "--endpoint")) &&
      getFlagValue(args, "--anon-key"),
  )

  if (fromWebEnv) {
    if (!webEnv) {
      process.stderr.write(
        "Could not find apps/web/.env.local or apps/web/.env. Run from the forge monorepo, or pass flags.\n",
      )
      process.exitCode = 1
      return
    }
    process.stdout.write(`Loaded defaults from ${webEnv.envPath}\n`)
  }

  if (!flagsComplete && (!fromWebEnv || !url || !anonKey)) {
    if (webEnv && !fromWebEnv) {
      process.stdout.write(
        `Found ${webEnv.envPath} - press Enter to accept defaults.\n\n`,
      )
    } else if (!webEnv) {
      process.stdout.write("No web environment found. Enter InsForge values.\n\n")
    }
    url = await promptWithDefault("InsForge URL", url)
    anonKey = await promptWithDefault("Anon key", anonKey, true)
  }

  if (!url || !anonKey) {
    process.stderr.write(
      "url and anon key are required.\n" +
        "Tip: run forge-cli init --from-web-env or pass --url and --anon-key.\n",
    )
    process.exitCode = 1
    return
  }

  const config: ForgeConfig = { url, anonKey }
  const path = await writeConfig(config)
  process.stdout.write(
    `Wrote config to ${path}\n` +
      `  url: ${config.url}\n` +
      "  anonKey: configured\n\n" +
      "Next: forge-cli login\n",
  )
}

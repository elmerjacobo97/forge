import { createAuthedResourcesService } from "../insforge.js"
import {
  parseResourceCreateInput,
  parseResourceUpdateInput,
} from "../resource-schema.js"
import {
  getFlagValue,
  getPositionals,
  hasFlag,
  parseTagsFlag,
} from "../flags.js"
import {
  writeResourceListOutput,
  writeResourceOutput,
} from "../format.js"
import { RESOURCE_KINDS, RESOURCE_TOOLS } from "../types.js"

const RESOURCE_HELP = `Usage:
  forge-cli resource <command> [options]

Commands:
  create    Create a resource
  list      List your resources
  get       Get a resource by id
  update    Update a resource by id
  delete    Delete a resource by id

Shared options:
  --json                       Emit JSON instead of text (create|list|get|update)

create options:
  --title <text>               Required (min 2)
  --kind <kind>                Required (${RESOURCE_KINDS.join(" | ")})
  --content <text>             Required
  --language <format>          Optional (json, yaml, javascript, typescript, markdown, env, plain-text, other)
  --tags <a,b,c>               Optional comma-separated tags
  --tool <tool>                Required when kind is config (${RESOURCE_TOOLS.join(" | ")})
  --custom-tool <name>         Required when tool is other
  --version <text>             Optional (config only)
  --context <text>             Optional (config only)

update options (at least one):
  --title <text>
  --kind <kind>
  --content <text>
  --language <format>
  --tags <a,b,c>
  --tool <tool>
  --custom-tool <name>
  --version <text>
  --context <text>

Examples:
  forge-cli resource create --title "ESLint flat" --kind config --content "{}" --language json --tool vscode --tags eslint
  forge-cli resource list
  forge-cli resource list --json
  forge-cli resource get <id> --json
  forge-cli resource update <id> --title "New title"
  forge-cli resource delete <id>
`

function fail(message: string): void {
  process.stderr.write(`${message}\n`)
  process.exitCode = 1
}

function readResourceFlags(args: string[]): Record<string, unknown> {
  const raw: Record<string, unknown> = {}
  const title = getFlagValue(args, "--title")
  const kind = getFlagValue(args, "--kind")
  const content = getFlagValue(args, "--content")
  const language = getFlagValue(args, "--language")
  const tagsRaw = getFlagValue(args, "--tags")
  const tool = getFlagValue(args, "--tool")
  const customTool = getFlagValue(args, "--custom-tool")
  const version = getFlagValue(args, "--version")
  const context = getFlagValue(args, "--context")

  if (title !== undefined) raw.title = title
  if (kind !== undefined) raw.kind = kind
  if (content !== undefined) raw.content = content
  if (language !== undefined) raw.language = language
  if (tagsRaw !== undefined) raw.tags = parseTagsFlag(tagsRaw)
  if (tool !== undefined) raw.tool = tool
  if (customTool !== undefined) raw.customTool = customTool
  if (version !== undefined) raw.version = version
  if (context !== undefined) raw.context = context

  return raw
}

async function runCreate(args: string[]): Promise<void> {
  const json = hasFlag(args, "--json")
  const input = parseResourceCreateInput({
    title: getFlagValue(args, "--title"),
    kind: getFlagValue(args, "--kind"),
    content: getFlagValue(args, "--content"),
    language: getFlagValue(args, "--language"),
    tags: parseTagsFlag(getFlagValue(args, "--tags")),
    tool: getFlagValue(args, "--tool"),
    customTool: getFlagValue(args, "--custom-tool"),
    version: getFlagValue(args, "--version"),
    context: getFlagValue(args, "--context"),
  })

  if ("error" in input) {
    fail(input.error)
    return
  }

  const service = await createAuthedResourcesService()
  const resource = await service.create(input)
  writeResourceOutput(resource, json)
}

async function runList(args: string[]): Promise<void> {
  const json = hasFlag(args, "--json")
  const service = await createAuthedResourcesService()
  const resources = await service.list()
  writeResourceListOutput(resources, json)
}

async function runGet(args: string[]): Promise<void> {
  const json = hasFlag(args, "--json")
  const [id] = getPositionals(args)
  if (!id) {
    fail("Missing resource id.\n\nUsage: forge-cli resource get <id>")
    return
  }

  const service = await createAuthedResourcesService()
  const resource = await service.get(id)
  writeResourceOutput(resource, json)
}

async function runUpdate(args: string[]): Promise<void> {
  const json = hasFlag(args, "--json")
  const [id] = getPositionals(args)
  if (!id) {
    fail("Missing resource id.\n\nUsage: forge-cli resource update <id> [--title …]")
    return
  }

  const raw = readResourceFlags(args)
  if (getFlagValue(args, "--tags") !== undefined) {
    raw.tags = parseTagsFlag(getFlagValue(args, "--tags"))
  }

  const input = parseResourceUpdateInput(raw)
  if ("error" in input) {
    fail(input.error)
    return
  }

  const service = await createAuthedResourcesService()
  const resource = await service.update(id, input)
  writeResourceOutput(resource, json)
}

async function runDelete(args: string[]): Promise<void> {
  const [id] = getPositionals(args)
  if (!id) {
    fail("Missing resource id.\n\nUsage: forge-cli resource delete <id>")
    return
  }

  const service = await createAuthedResourcesService()
  await service.delete(id)
  process.stdout.write(`Deleted resource ${id}\n`)
}

export async function runResource(args: string[]): Promise<void> {
  if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
    process.stdout.write(`${RESOURCE_HELP}\n`)
    return
  }

  const [subcommand, ...rest] = args

  switch (subcommand) {
    case "create":
      await runCreate(rest)
      return
    case "list":
      await runList(rest)
      return
    case "get":
      await runGet(rest)
      return
    case "update":
      await runUpdate(rest)
      return
    case "delete":
      await runDelete(rest)
      return
    default:
      fail(`Unknown resource command: ${subcommand}\n\n${RESOURCE_HELP}`)
  }
}

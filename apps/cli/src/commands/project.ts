import { createAuthedProjectsService } from "../insforge.js"
import {
  getFlagValue,
  getPositionals,
  hasFlag,
} from "../flags.js"
import {
  writeProjectListOutput,
  writeProjectOutput,
} from "../format.js"
import {
  parseProjectCreateInput,
  parseProjectUpdateInput,
} from "../project-schema.js"

const PROJECT_HELP = `Usage:
  forge-cli project <command> [options]

Commands:
  create    Create a project
  list      List your projects
  get       Get a project by id
  update    Update name/description
  delete    Delete a project by id (fails if it has tickets)

Shared options:
  --json                       Emit JSON instead of text (create|list|get|update)

create options:
  --name <text>                Required (1-80)
  --description <text>         Optional (default "", max 2000)

update options (at least one):
  --name <text>
  --description <text>

Examples:
  forge-cli project create --name "Forge"
  forge-cli project create --name "Forge" --description "Dev tools"
  forge-cli project list
  forge-cli project list --json
  forge-cli project get <id>
  forge-cli project update <id> --name "New name"
  forge-cli project delete <id>
`

function fail(message: string): void {
  process.stderr.write(`${message}\n`)
  process.exitCode = 1
}

async function runCreate(args: string[]): Promise<void> {
  const json = hasFlag(args, "--json")
  const input = parseProjectCreateInput({
    name: getFlagValue(args, "--name"),
    description: getFlagValue(args, "--description") ?? "",
  })

  if ("error" in input) {
    fail(input.error)
    return
  }

  const service = await createAuthedProjectsService()
  const project = await service.create(input)
  writeProjectOutput(project, json)
}

async function runList(args: string[]): Promise<void> {
  const json = hasFlag(args, "--json")
  const service = await createAuthedProjectsService()
  const projects = await service.list()
  writeProjectListOutput(projects, json)
}

async function runGet(args: string[]): Promise<void> {
  const json = hasFlag(args, "--json")
  const [id] = getPositionals(args)
  if (!id) {
    fail("Missing project id.\n\nUsage: forge-cli project get <id>")
    return
  }

  const service = await createAuthedProjectsService()
  const project = await service.get(id)
  writeProjectOutput(project, json)
}

async function runUpdate(args: string[]): Promise<void> {
  const json = hasFlag(args, "--json")
  const [id] = getPositionals(args)
  if (!id) {
    fail(
      "Missing project id.\n\nUsage: forge-cli project update <id> [--name …]",
    )
    return
  }

  const raw: Record<string, unknown> = {}
  const name = getFlagValue(args, "--name")
  const description = getFlagValue(args, "--description")

  if (name !== undefined) raw.name = name
  if (description !== undefined) raw.description = description

  const input = parseProjectUpdateInput(raw)
  if ("error" in input) {
    fail(input.error)
    return
  }

  const service = await createAuthedProjectsService()
  const project = await service.update(id, input)
  writeProjectOutput(project, json)
}

async function runDelete(args: string[]): Promise<void> {
  const [id] = getPositionals(args)
  if (!id) {
    fail("Missing project id.\n\nUsage: forge-cli project delete <id>")
    return
  }

  const service = await createAuthedProjectsService()
  await service.delete(id)
  process.stdout.write(`Deleted project ${id}\n`)
}

export async function runProject(args: string[]): Promise<void> {
  if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
    process.stdout.write(`${PROJECT_HELP}\n`)
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
      fail(`Unknown project command: ${subcommand}\n\n${PROJECT_HELP}`)
  }
}

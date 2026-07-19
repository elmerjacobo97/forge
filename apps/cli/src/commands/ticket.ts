import { createAuthedDevBoardService } from "../appwrite.js"
import {
  getFlagValue,
  getPositionals,
  hasFlag,
} from "../flags.js"
import {
  writeTicketListOutput,
  writeTicketOutput,
} from "../format.js"
import {
  parseColumnId,
  parseTicketCreateInput,
  parseTicketMoveInput,
  parseTicketUpdateInput,
} from "../ticket-schema.js"
import { COLUMNS, PRIORITIES, type ColumnId } from "../types.js"

const TICKET_HELP = `Usage:
  forge-cli ticket <command> [options]

Commands:
  create    Create a ticket
  list      List your tickets
  get       Get a ticket by id
  update    Update title/description/priority
  delete    Delete a ticket by id
  move      Move a ticket to another column

Shared options:
  --json                       Emit JSON instead of text (create|list|get|update|move)

create options:
  --title <text>               Required (1-120)
  --description <text>         Optional (default "")
  --priority <priority>        Optional (${PRIORITIES.join(" | ")}, default med)
  --column <column>            Optional (${COLUMNS.join(" | ")}, default backlog)

list options:
  --column <column>            Optional filter by column

update options (at least one):
  --title <text>
  --description <text>
  --priority <priority>

move options:
  --column <column>            Required destination column

Examples:
  forge-cli ticket create --title "Ship CLI"
  forge-cli ticket create --title "WIP" --column in_progress --priority high
  forge-cli ticket list
  forge-cli ticket list --column todo --json
  forge-cli ticket get <id>
  forge-cli ticket update <id> --title "New title"
  forge-cli ticket move <id> --column in_progress
  forge-cli ticket delete <id>
`

function fail(message: string): void {
  process.stderr.write(`${message}\n`)
  process.exitCode = 1
}

async function runCreate(args: string[]): Promise<void> {
  const json = hasFlag(args, "--json")
  const input = parseTicketCreateInput({
    title: getFlagValue(args, "--title"),
    description: getFlagValue(args, "--description") ?? "",
    priority: getFlagValue(args, "--priority") ?? "med",
    column: getFlagValue(args, "--column") ?? "backlog",
  })

  if ("error" in input) {
    fail(input.error)
    return
  }

  const service = await createAuthedDevBoardService()
  const ticket = await service.create(input)
  writeTicketOutput(ticket, json)
}

async function runList(args: string[]): Promise<void> {
  const json = hasFlag(args, "--json")
  const columnRaw = getFlagValue(args, "--column")
  let columnFilter: ColumnId | undefined

  if (columnRaw !== undefined) {
    const parsed = parseColumnId(columnRaw)
    if (typeof parsed === "object" && "error" in parsed) {
      fail(parsed.error)
      return
    }
    columnFilter = parsed
  }

  const service = await createAuthedDevBoardService()
  const tickets = await service.list(columnFilter)
  writeTicketListOutput(tickets, json)
}

async function runGet(args: string[]): Promise<void> {
  const json = hasFlag(args, "--json")
  const [id] = getPositionals(args)
  if (!id) {
    fail("Missing ticket id.\n\nUsage: forge-cli ticket get <id>")
    return
  }

  const service = await createAuthedDevBoardService()
  const ticket = await service.get(id)
  writeTicketOutput(ticket, json)
}

async function runUpdate(args: string[]): Promise<void> {
  const json = hasFlag(args, "--json")
  const [id] = getPositionals(args)
  if (!id) {
    fail(
      "Missing ticket id.\n\nUsage: forge-cli ticket update <id> [--title …]",
    )
    return
  }

  const raw: Record<string, unknown> = {}
  const title = getFlagValue(args, "--title")
  const description = getFlagValue(args, "--description")
  const priority = getFlagValue(args, "--priority")

  if (title !== undefined) raw.title = title
  if (description !== undefined) raw.description = description
  if (priority !== undefined) raw.priority = priority

  const input = parseTicketUpdateInput(raw)
  if ("error" in input) {
    fail(input.error)
    return
  }

  const service = await createAuthedDevBoardService()
  const ticket = await service.update(id, input)
  writeTicketOutput(ticket, json)
}

async function runDelete(args: string[]): Promise<void> {
  const [id] = getPositionals(args)
  if (!id) {
    fail("Missing ticket id.\n\nUsage: forge-cli ticket delete <id>")
    return
  }

  const service = await createAuthedDevBoardService()
  await service.delete(id)
  process.stdout.write(`Deleted ticket ${id}\n`)
}

async function runMove(args: string[]): Promise<void> {
  const json = hasFlag(args, "--json")
  const [id] = getPositionals(args)
  const column = getFlagValue(args, "--column")

  const input = parseTicketMoveInput({ id: id ?? "", column })
  if ("error" in input) {
    fail(input.error)
    return
  }

  const service = await createAuthedDevBoardService()
  const ticket = await service.move(input.id, input.column)
  writeTicketOutput(ticket, json)
}

export async function runTicket(args: string[]): Promise<void> {
  if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
    process.stdout.write(`${TICKET_HELP}\n`)
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
    case "move":
      await runMove(rest)
      return
    default:
      fail(`Unknown ticket command: ${subcommand}\n\n${TICKET_HELP}`)
  }
}

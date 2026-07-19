import { createAuthedBookmarksService } from "../appwrite.js"
import {
  parseBookmarkCreateInput,
  parseBookmarkUpdateInput,
} from "../bookmark-schema.js"
import { getFlagValue } from "../flags.js"
import { formatBookmarkListText, formatBookmarkText } from "../format.js"
import { CATEGORIES } from "../types.js"

const BOOKMARK_HELP = `Usage:
  forge-cli bookmark <command> [options]

Commands:
  create    Create a bookmark
  list      List your bookmarks
  get       Get a bookmark by id
  update    Update a bookmark by id
  delete    Delete a bookmark by id

create options:
  --title <text>           Required (min 2)
  --url <url>              Required (valid URL)
  --category <category>    Required (${CATEGORIES.join(" | ")})
  --description <text>     Required (5-200)
  --tags <a,b,c>           Optional comma-separated tags

update options (at least one):
  --title <text>
  --url <url>
  --category <category>
  --description <text>
  --tags <a,b,c>

Examples:
  forge-cli bookmark create --title "Docs" --url "https://example.com" --category docs --description "Useful docs" --tags react,docs
  forge-cli bookmark list
  forge-cli bookmark get <id>
  forge-cli bookmark update <id> --title "New title"
  forge-cli bookmark delete <id>
`

function parseTagsFlag(raw: string | undefined): string[] {
  if (raw == null || raw.trim() === "") return []
  return raw
    .split(",")
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0)
}

function getPositionals(args: string[]): string[] {
  const positionals: string[] = []
  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (arg.startsWith("--")) {
      const next = args[i + 1]
      if (next && !next.startsWith("--")) i += 1
      continue
    }
    positionals.push(arg)
  }
  return positionals
}

function fail(message: string): void {
  process.stderr.write(`${message}\n`)
  process.exitCode = 1
}

async function runCreate(args: string[]): Promise<void> {
  const input = parseBookmarkCreateInput({
    title: getFlagValue(args, "--title"),
    url: getFlagValue(args, "--url"),
    category: getFlagValue(args, "--category"),
    description: getFlagValue(args, "--description"),
    tags: parseTagsFlag(getFlagValue(args, "--tags")),
  })

  if ("error" in input) {
    fail(input.error)
    return
  }

  const service = await createAuthedBookmarksService()
  const bookmark = await service.create(input)
  process.stdout.write(`${formatBookmarkText(bookmark)}\n`)
}

async function runList(_args: string[]): Promise<void> {
  const service = await createAuthedBookmarksService()
  const bookmarks = await service.list()
  process.stdout.write(`${formatBookmarkListText(bookmarks)}\n`)
}

async function runGet(args: string[]): Promise<void> {
  const [id] = getPositionals(args)
  if (!id) {
    fail("Missing bookmark id.\n\nUsage: forge-cli bookmark get <id>")
    return
  }

  const service = await createAuthedBookmarksService()
  const bookmark = await service.get(id)
  process.stdout.write(`${formatBookmarkText(bookmark)}\n`)
}

async function runUpdate(args: string[]): Promise<void> {
  const [id] = getPositionals(args)
  if (!id) {
    fail("Missing bookmark id.\n\nUsage: forge-cli bookmark update <id> [--title …]")
    return
  }

  const raw: Record<string, unknown> = {}
  const title = getFlagValue(args, "--title")
  const url = getFlagValue(args, "--url")
  const category = getFlagValue(args, "--category")
  const description = getFlagValue(args, "--description")
  const tagsRaw = getFlagValue(args, "--tags")

  if (title !== undefined) raw.title = title
  if (url !== undefined) raw.url = url
  if (category !== undefined) raw.category = category
  if (description !== undefined) raw.description = description
  if (tagsRaw !== undefined) raw.tags = parseTagsFlag(tagsRaw)

  const input = parseBookmarkUpdateInput(raw)
  if ("error" in input) {
    fail(input.error)
    return
  }

  const service = await createAuthedBookmarksService()
  const bookmark = await service.update(id, input)
  process.stdout.write(`${formatBookmarkText(bookmark)}\n`)
}

async function runDelete(args: string[]): Promise<void> {
  const [id] = getPositionals(args)
  if (!id) {
    fail("Missing bookmark id.\n\nUsage: forge-cli bookmark delete <id>")
    return
  }

  const service = await createAuthedBookmarksService()
  await service.delete(id)
  process.stdout.write(`Deleted bookmark ${id}\n`)
}

export async function runBookmark(args: string[]): Promise<void> {
  if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
    process.stdout.write(`${BOOKMARK_HELP}\n`)
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
      fail(`Unknown bookmark command: ${subcommand}\n\n${BOOKMARK_HELP}`)
  }
}

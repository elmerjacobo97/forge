import { parseNoteCreateInput, parseNoteUpdateInput } from "@forge/core";
import type { NoteListOptions } from "@forge/core";
import {
  getFlagValue,
  getPositionals,
  hasFlag,
  parseListOptions,
  parseTagsFlag,
} from "../flags.js";
import {
  writeDeletedOutput,
  writeErrorOutput,
  writeNoteListOutput,
  writeNoteOutput,
} from "../format.js";
import { createAuthedNotesService } from "../insforge.js";

const NOTE_HELP = `Usage:
  forge-cli note <command> [options]

Commands:
  add       Add a note
  list      List or search your notes
  get       Get a note by id
  update    Update a note by id
  delete    Delete a note by id

Shared options:
  --json                       Emit JSON instead of text (add|list|get|update)

list options:
  --q <text>               Search title, content and exact tag
  --tag <tag>              Only notes with this tag
  --project-id <id>        Only notes linked to this project
  --limit <n>              Optional max rows (1-1000)
  --offset <n>             Optional rows to skip (>= 0, requires --limit)

add options:
  --title <text>               Required (min 2)
  --content <markdown>         Required
  --tags <a,b,c>               Optional comma-separated tags (stored lowercase)
  --project-id <id>            Optional; omit for a global note

update options (at least one):
  --title <text>
  --content <markdown>
  --tags <a,b,c>               Empty string clears tags
  --project-id <id>            Link to a project
  --clear-project              Unlink from its project

Examples:
  forge-cli note add --title "Expo SDK 52 router" --content "Use expo-router v4 layout" --tags expo,rn-0.76
  forge-cli note list --q router --tag expo
  forge-cli note list --project-id <id> --json
  forge-cli note get <id> --json
  forge-cli note update <id> --clear-project
  forge-cli note delete <id>
`;

function fail(message: string, json: boolean): void {
  writeErrorOutput(message, json);
  process.exitCode = 1;
}

function readNoteFlags(args: string[]): Record<string, unknown> {
  const raw: Record<string, unknown> = {};
  const title = getFlagValue(args, "--title");
  const content = getFlagValue(args, "--content");
  const projectId = getFlagValue(args, "--project-id");

  if (title !== undefined) raw.title = title;
  if (content !== undefined) raw.content = content;
  if (projectId !== undefined) raw.projectId = projectId;
  if (hasFlag(args, "--tags")) raw.tags = parseTagsFlag(getFlagValue(args, "--tags"));

  return raw;
}

async function runAdd(args: string[]): Promise<void> {
  const json = hasFlag(args, "--json");
  const input = parseNoteCreateInput(readNoteFlags(args));

  if ("error" in input) {
    fail(input.error, json);
    return;
  }

  const service = await createAuthedNotesService();
  writeNoteOutput(await service.create(input), json);
}

async function runList(args: string[]): Promise<void> {
  const json = hasFlag(args, "--json");
  const parsed = parseListOptions(args);
  if ("error" in parsed) {
    fail(parsed.error, json);
    return;
  }

  const options: NoteListOptions = { ...parsed.options };
  const q = getFlagValue(args, "--q");
  const tag = getFlagValue(args, "--tag");
  const projectId = getFlagValue(args, "--project-id");
  if (q !== undefined) options.q = q;
  if (tag !== undefined) options.tag = tag;
  if (projectId !== undefined) options.projectId = projectId;

  const service = await createAuthedNotesService();
  writeNoteListOutput(await service.list(options), json);
}

async function runGet(args: string[]): Promise<void> {
  const json = hasFlag(args, "--json");
  const [id] = getPositionals(args);
  if (!id) {
    fail("Missing note id.\n\nUsage: forge-cli note get <id>", json);
    return;
  }

  const service = await createAuthedNotesService();
  writeNoteOutput(await service.get(id), json);
}

async function runUpdate(args: string[]): Promise<void> {
  const json = hasFlag(args, "--json");
  const [id] = getPositionals(args);
  if (!id) {
    fail("Missing note id.\n\nUsage: forge-cli note update <id> [--title …]", json);
    return;
  }

  const raw = readNoteFlags(args);
  if (hasFlag(args, "--clear-project")) {
    if (raw.projectId !== undefined) {
      fail("Use either --project-id or --clear-project, not both.", json);
      return;
    }
    raw.projectId = null;
  }

  const input = parseNoteUpdateInput(raw);
  if ("error" in input) {
    fail(input.error, json);
    return;
  }

  const service = await createAuthedNotesService();
  writeNoteOutput(await service.update(id, input), json);
}

async function runDelete(args: string[]): Promise<void> {
  const json = hasFlag(args, "--json");
  const [id] = getPositionals(args);
  if (!id) {
    fail("Missing note id.\n\nUsage: forge-cli note delete <id>", json);
    return;
  }

  const service = await createAuthedNotesService();
  await service.delete(id);
  writeDeletedOutput("note", id, json);
}

export async function runNote(args: string[]): Promise<void> {
  if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
    process.stdout.write(`${NOTE_HELP}\n`);
    return;
  }

  const [subcommand, ...rest] = args;

  switch (subcommand) {
    case "add":
      await runAdd(rest);
      return;
    case "list":
      await runList(rest);
      return;
    case "get":
      await runGet(rest);
      return;
    case "update":
      await runUpdate(rest);
      return;
    case "delete":
      await runDelete(rest);
      return;
    default:
      fail(`Unknown note command: ${subcommand}\n\n${NOTE_HELP}`, hasFlag(args, "--json"));
  }
}

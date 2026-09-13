import {
  IDEA_CATEGORIES,
  IDEA_STATUSES,
  parseIdeaCreateInput,
  parseIdeaUpdateInput,
} from "@forge/core";
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
  writeIdeaListOutput,
  writeIdeaOutput,
} from "../format.js";
import { createAuthedIdeasService } from "../insforge.js";

const IDEA_HELP = `Usage:
  forge-cli idea <command> [options]

Commands:
  create    Create an idea
  list      List your ideas
  get       Get an idea by id
  update    Update an idea by id
  delete    Delete an idea by id

Shared options:
  --json                       Emit JSON instead of text (create|list|get|update)

list options:
  --limit <n>              Optional max rows (1-1000)
  --offset <n>             Optional rows to skip (>= 0, requires --limit)

create options:
  --title <text>               Required (min 2)
  --content <text>             Required
  --status <status>            Optional (default seed; ${IDEA_STATUSES.join(" | ")})
  --category <category>        Optional (default other; ${IDEA_CATEGORIES.join(" | ")})
  --tags <a,b,c>               Optional comma-separated tags
  --links <url,url>            Optional comma-separated URLs (max 10)

update options (at least one):
  --title <text>
  --content <text>
  --status <status>
  --category <category>
  --tags <a,b,c>               Empty string clears tags
  --links <url,url>            Empty string clears links

Examples:
  forge-cli idea create --title "Coffee meetup app" --content "Join strangers for coffee" --category mobile --tags social,local
  forge-cli idea create --title "Coffee meetup app" --content "Join strangers for coffee" --links https://example.com/inspiration
  forge-cli idea list
  forge-cli idea list --json
  forge-cli idea list --limit 10 --offset 10
  forge-cli idea get <id> --json
  forge-cli idea update <id> --status building
  forge-cli idea delete <id>
`;

function fail(message: string, json: boolean): void {
  writeErrorOutput(message, json);
  process.exitCode = 1;
}

function readIdeaFlags(args: string[]): Record<string, unknown> {
  const raw: Record<string, unknown> = {};
  const title = getFlagValue(args, "--title");
  const content = getFlagValue(args, "--content");
  const status = getFlagValue(args, "--status");
  const category = getFlagValue(args, "--category");

  if (title !== undefined) raw.title = title;
  if (content !== undefined) raw.content = content;
  if (status !== undefined) raw.status = status;
  if (category !== undefined) raw.category = category;
  if (hasFlag(args, "--tags")) raw.tags = parseTagsFlag(getFlagValue(args, "--tags"));
  if (hasFlag(args, "--links")) raw.links = parseTagsFlag(getFlagValue(args, "--links"));

  return raw;
}

async function runCreate(args: string[]): Promise<void> {
  const json = hasFlag(args, "--json");
  const input = parseIdeaCreateInput(readIdeaFlags(args));

  if ("error" in input) {
    fail(input.error, json);
    return;
  }

  const service = await createAuthedIdeasService();
  const idea = await service.create(input);
  writeIdeaOutput(idea, json);
}

async function runList(args: string[]): Promise<void> {
  const json = hasFlag(args, "--json");
  const parsed = parseListOptions(args);
  if ("error" in parsed) {
    fail(parsed.error, json);
    return;
  }

  const service = await createAuthedIdeasService();
  const ideas = await service.list(parsed.options);
  writeIdeaListOutput(ideas, json);
}

async function runGet(args: string[]): Promise<void> {
  const json = hasFlag(args, "--json");
  const [id] = getPositionals(args);
  if (!id) {
    fail("Missing idea id.\n\nUsage: forge-cli idea get <id>", json);
    return;
  }

  const service = await createAuthedIdeasService();
  const idea = await service.get(id);
  writeIdeaOutput(idea, json);
}

async function runUpdate(args: string[]): Promise<void> {
  const json = hasFlag(args, "--json");
  const [id] = getPositionals(args);
  if (!id) {
    fail("Missing idea id.\n\nUsage: forge-cli idea update <id> [--title …]", json);
    return;
  }

  const input = parseIdeaUpdateInput(readIdeaFlags(args));
  if ("error" in input) {
    fail(input.error, json);
    return;
  }

  const service = await createAuthedIdeasService();
  const idea = await service.update(id, input);
  writeIdeaOutput(idea, json);
}

async function runDelete(args: string[]): Promise<void> {
  const json = hasFlag(args, "--json");
  const [id] = getPositionals(args);
  if (!id) {
    fail("Missing idea id.\n\nUsage: forge-cli idea delete <id>", json);
    return;
  }

  const service = await createAuthedIdeasService();
  await service.delete(id);
  writeDeletedOutput("idea", id, json);
}

export async function runIdea(args: string[]): Promise<void> {
  if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
    process.stdout.write(`${IDEA_HELP}\n`);
    return;
  }

  const [subcommand, ...rest] = args;

  switch (subcommand) {
    case "create":
      await runCreate(rest);
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
      fail(`Unknown idea command: ${subcommand}\n\n${IDEA_HELP}`, hasFlag(args, "--json"));
  }
}

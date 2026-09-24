import {
  parseResourceCreateInput,
  parseResourceUpdateInput,
  RESOURCE_CATEGORIES,
} from "@forge/core";
import { createAuthedResourcesService } from "../insforge.js";
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
  writeResourceListOutput,
  writeResourceOutput,
} from "../format.js";

const RESOURCE_HELP = `Usage:
  forge-cli resource <command> [options]
  forge-cli bookmark <command> [options]  Alias for resource

Commands:
  create    Create a resource
  list      List your resources
  get       Get a resource by id
  update    Update a resource by id
  delete    Delete a resource by id

Shared options:
  --json                       Emit JSON instead of text (create|list|get|update)

list options:
  --limit <n>              Optional max rows (1-1000)
  --offset <n>             Optional rows to skip (>= 0, requires --limit)

create options:
  --title <text>           Required (min 2)
  --url <url>              Required (valid URL)
  --category <category>    Required (${RESOURCE_CATEGORIES.join(" | ")})
  --description <text>     Required (5-200)
  --tags <a,b,c>           Optional comma-separated tags

update options (at least one):
  --title <text>
  --url <url>
  --category <category>
  --description <text>
  --tags <a,b,c>

Examples:
  forge-cli resource create --title "React docs" --url https://react.dev --category docs --description "Official React documentation" --tags react,docs
  forge-cli resource list
  forge-cli resource list --json
  forge-cli resource list --limit 10 --offset 10
  forge-cli resource get <id> --json
  forge-cli resource update <id> --title "New title"
  forge-cli resource delete <id>
`;

function fail(message: string, json: boolean): void {
  writeErrorOutput(message, json);
  process.exitCode = 1;
}

function readResourceFlags(args: string[]): Record<string, unknown> {
  const raw: Record<string, unknown> = {};
  const title = getFlagValue(args, "--title");
  const url = getFlagValue(args, "--url");
  const category = getFlagValue(args, "--category");
  const description = getFlagValue(args, "--description");
  const tags = getFlagValue(args, "--tags");

  if (title !== undefined) raw.title = title;
  if (url !== undefined) raw.url = url;
  if (category !== undefined) raw.category = category;
  if (description !== undefined) raw.description = description;
  if (tags !== undefined) raw.tags = parseTagsFlag(tags);

  return raw;
}

async function runCreate(args: string[]): Promise<void> {
  const json = hasFlag(args, "--json");
  const input = parseResourceCreateInput({
    ...readResourceFlags(args),
    tags: parseTagsFlag(getFlagValue(args, "--tags")),
  });
  if ("error" in input) {
    fail(input.error, json);
    return;
  }

  const resource = await (await createAuthedResourcesService()).create(input);
  writeResourceOutput(resource, json);
}

async function runList(args: string[]): Promise<void> {
  const json = hasFlag(args, "--json");
  const parsed = parseListOptions(args);
  if ("error" in parsed) {
    fail(parsed.error, json);
    return;
  }

  const resources = await (await createAuthedResourcesService()).list(parsed.options);
  writeResourceListOutput(resources, json);
}

async function runGet(args: string[]): Promise<void> {
  const json = hasFlag(args, "--json");
  const [id] = getPositionals(args);
  if (!id) {
    fail("Missing resource id.\n\nUsage: forge-cli resource get <id>", json);
    return;
  }

  const resource = await (await createAuthedResourcesService()).get(id);
  writeResourceOutput(resource, json);
}

async function runUpdate(args: string[]): Promise<void> {
  const json = hasFlag(args, "--json");
  const [id] = getPositionals(args);
  if (!id) {
    fail("Missing resource id.\n\nUsage: forge-cli resource update <id> [--title …]", json);
    return;
  }

  const input = parseResourceUpdateInput(readResourceFlags(args));
  if ("error" in input) {
    fail(input.error, json);
    return;
  }

  const resource = await (await createAuthedResourcesService()).update(id, input);
  writeResourceOutput(resource, json);
}

async function runDelete(args: string[]): Promise<void> {
  const json = hasFlag(args, "--json");
  const [id] = getPositionals(args);
  if (!id) {
    fail("Missing resource id.\n\nUsage: forge-cli resource delete <id>", json);
    return;
  }

  await (await createAuthedResourcesService()).delete(id);
  writeDeletedOutput("resource", id, json);
}

export async function runResource(args: string[]): Promise<void> {
  if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
    process.stdout.write(`${RESOURCE_HELP}\n`);
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
      fail(`Unknown resource command: ${subcommand}\n\n${RESOURCE_HELP}`, hasFlag(args, "--json"));
  }
}

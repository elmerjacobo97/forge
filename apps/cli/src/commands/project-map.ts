import { readFile } from "node:fs/promises";
import { parseProjectFlowUpsertInput, parseProjectModuleUpsertInput } from "@forge/core";
import type { ProjectFlowUpsertInput } from "@forge/core";
import { getFlagValue, getPositionals, hasFlag, parseTagsFlag } from "../flags.js";
import {
  writeDeletedOutput,
  writeErrorOutput,
  writeProjectFlowOutput,
  writeProjectMapOutput,
  writeProjectModuleOutput,
} from "../format.js";
import { createAuthedProjectMapService } from "../insforge.js";

export const PROJECT_MAP_HELP = `Usage:
  forge-cli project map <command> [options]

Commands:
  get <projectId>                          Modules and flow summaries
  module set <projectId> <slug>            Create or replace a module
  module delete <projectId> <slug>         Delete a module and its flows
  flow get <projectId> <slug>              Show a flow with its steps
  flow set <projectId> --file <flow.json>  Create or replace a flow
  flow delete <projectId> <slug>           Delete a flow

module set options:
  --name <text>                Required (1-120)
  --description <text>         Optional (max 2000)
  --depends-on <a,b>           Slugs of existing modules

flow set file (JSON):
  { "moduleSlug", "slug", "title", "summary"?, "commit"?, "steps": [1-20 of
    { "kind", "label", "symbol"?, "file"?, "line"?, "input"?, "output"?, "inferred"? } ] }
  kind: page|ui|action|service|db|command|tool. file is relative to the repo.

Shared options:
  --json                       Emit JSON instead of text
`;

function fail(message: string, json: boolean): void {
  writeErrorOutput(message, json);
  process.exitCode = 1;
}

/** Parse the `--file` JSON of `flow set`; returns an error instead of touching the service. */
export function parseFlowFileText(text: string): ProjectFlowUpsertInput | { error: string } {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch (error) {
    return { error: `Invalid JSON in --file: ${error instanceof Error ? error.message : error}` };
  }
  return parseProjectFlowUpsertInput(raw);
}

async function runGet(args: string[]): Promise<void> {
  const json = hasFlag(args, "--json");
  const [projectId] = getPositionals(args);
  if (!projectId) {
    fail("Missing project id.\n\nUsage: forge-cli project map get <projectId>", json);
    return;
  }

  const service = await createAuthedProjectMapService();
  writeProjectMapOutput(await service.getMap(projectId), json);
}

async function runModuleSet(args: string[]): Promise<void> {
  const json = hasFlag(args, "--json");
  const [projectId, slug] = getPositionals(args);
  if (!projectId || !slug) {
    fail(
      "Missing project id or slug.\n\nUsage: forge-cli project map module set <projectId> <slug> --name <text>",
      json,
    );
    return;
  }

  const input = parseProjectModuleUpsertInput({
    slug,
    name: getFlagValue(args, "--name"),
    description: getFlagValue(args, "--description") ?? "",
    dependsOn: parseTagsFlag(getFlagValue(args, "--depends-on")),
  });
  if ("error" in input) {
    fail(input.error, json);
    return;
  }

  const service = await createAuthedProjectMapService();
  writeProjectModuleOutput(await service.upsertModule(projectId, input), json);
}

async function runFlowSet(args: string[]): Promise<void> {
  const json = hasFlag(args, "--json");
  const [projectId] = getPositionals(args);
  const file = getFlagValue(args, "--file");
  if (!projectId || !file) {
    fail(
      "Missing project id or --file.\n\nUsage: forge-cli project map flow set <projectId> --file <flow.json>",
      json,
    );
    return;
  }

  let text: string;
  try {
    text = await readFile(file, "utf8");
  } catch (error) {
    fail(`Cannot read --file: ${error instanceof Error ? error.message : error}`, json);
    return;
  }

  const input = parseFlowFileText(text);
  if ("error" in input) {
    fail(input.error, json);
    return;
  }

  const service = await createAuthedProjectMapService();
  writeProjectFlowOutput(await service.upsertFlow(projectId, input), json);
}

async function runBySlug(
  args: string[],
  usage: string,
  run: (projectId: string, slug: string, json: boolean) => Promise<void>,
): Promise<void> {
  const json = hasFlag(args, "--json");
  const [projectId, slug] = getPositionals(args);
  if (!projectId || !slug) {
    fail(`Missing project id or slug.\n\nUsage: ${usage}`, json);
    return;
  }
  await run(projectId, slug, json);
}

export async function runProjectMap(args: string[]): Promise<void> {
  const [scope, action, ...rest] = args;

  if (scope === undefined || scope === "--help" || scope === "-h") {
    process.stdout.write(`${PROJECT_MAP_HELP}\n`);
    return;
  }
  if (scope === "get") {
    await runGet(args.slice(1));
    return;
  }

  const route = `${scope} ${action}`;
  switch (route) {
    case "module set":
      await runModuleSet(rest);
      return;
    case "module delete":
      await runBySlug(
        rest,
        "forge-cli project map module delete <projectId> <slug>",
        async (projectId, slug, json) => {
          await (await createAuthedProjectMapService()).deleteModule(projectId, slug);
          writeDeletedOutput("module", slug, json);
        },
      );
      return;
    case "flow get":
      await runBySlug(
        rest,
        "forge-cli project map flow get <projectId> <slug>",
        async (projectId, slug, json) => {
          writeProjectFlowOutput(
            await (await createAuthedProjectMapService()).getFlow(projectId, slug),
            json,
          );
        },
      );
      return;
    case "flow set":
      await runFlowSet(rest);
      return;
    case "flow delete":
      await runBySlug(
        rest,
        "forge-cli project map flow delete <projectId> <slug>",
        async (projectId, slug, json) => {
          await (await createAuthedProjectMapService()).deleteFlow(projectId, slug);
          writeDeletedOutput("flow", slug, json);
        },
      );
      return;
    default:
      fail(`Unknown project map command: ${route}\n\n${PROJECT_MAP_HELP}`, hasFlag(args, "--json"));
  }
}

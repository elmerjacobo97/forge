import { createAuthedClient, createAuthedDevBoardService } from "../insforge.js";
import { createDevBoardService } from "../dev-board-service.js";
import { getFlagValue, getPositionals, hasFlag } from "../flags.js";
import {
  writeCommentListOutput,
  writeCommentOutput,
  writeDeletedOutput,
  writeErrorOutput,
  writeNextContextOutput,
  writeTicketListOutput,
  writeTicketOutput,
} from "../format.js";
import { createProjectsService } from "../projects-service.js";
import {
  parseColumnId,
  parseTicketCommentInput,
  parseTicketCreateInput,
  parseTicketMoveInput,
  parseTicketUpdateInput,
} from "../ticket-schema.js";
import { COLUMNS, PRIORITIES, type ColumnId } from "../types.js";

const TICKET_HELP = `Usage:
  forge-cli ticket <command> [options]

Commands:
  create    Create a ticket
  list      List tickets in a project
  get       Get a ticket by id
  update    Update title/description/priority/handoff
  delete    Delete a ticket by id
  move      Move a ticket to another column
  next      Show the next pending ticket with context
  comment   Add a comment to a ticket
  comments  List a ticket comments

Shared options:
  --json                       Emit JSON instead of text (all commands)

create options:
  --project-id <id>            Required Dev Board project id
  --title <text>               Required (1-120)
  --description <text>         Optional (default "")
  --priority <priority>        Optional (${PRIORITIES.join(" | ")}, default med)
  --column <column>            Optional (${COLUMNS.join(" | ")}, default backlog)

list options:
  --project-id <id>            Required Dev Board project id
  --column <column>            Optional filter by column

next options:
  --project-id <id>            Optional project filter (default: all projects)

update options (at least one):
  --title <text>
  --description <text>
  --priority <priority>
  --branch <name>              Bind a git branch (1-200)
  --pr-url <url>               Bind a PR URL (http/https, max 2048)
  --clear-branch               Clear the branch
  --clear-pr-url               Clear the PR URL

move options:
  --column <column>            Required destination column
  --branch <name>              Bind a git branch in the same call
  --pr-url <url>               Bind a PR URL in the same call
  --clear-branch               Clear the branch
  --clear-pr-url               Clear the PR URL

comment options:
  --body <text>                Required (1-5000)
  --author <author>            Optional (user | agent, default user)

Examples:
  forge-cli ticket create --project-id <id> --title "Ship CLI"
  forge-cli ticket create --project-id <id> --title "WIP" --column in_progress --priority high
  forge-cli ticket list --project-id <id>
  forge-cli ticket list --project-id <id> --column todo --json
  forge-cli ticket get <id>
  forge-cli ticket update <id> --title "New title"
  forge-cli ticket update <id> --clear-branch --clear-pr-url
  forge-cli ticket move <id> --column review --branch dev/handoff --pr-url https://github.com/acme/forge/pull/17
  forge-cli ticket next --json
  forge-cli ticket comment <id> --body "Moved to review" --author agent
  forge-cli ticket comments <id> --json
  forge-cli ticket delete <id> --json
`;

function fail(message: string, json: boolean): void {
  writeErrorOutput(message, json)
  process.exitCode = 1
}

async function runCreate(args: string[]): Promise<void> {
  const json = hasFlag(args, "--json");
  const input = parseTicketCreateInput({
    projectId: getFlagValue(args, "--project-id"),
    title: getFlagValue(args, "--title"),
    description: getFlagValue(args, "--description") ?? "",
    priority: getFlagValue(args, "--priority") ?? "med",
    column: getFlagValue(args, "--column") ?? "backlog",
  });

  if ("error" in input) {
    fail(input.error, json);
    return;
  }

  const { client } = await createAuthedClient();
  const projects = createProjectsService({ client });
  // Verify the project exists and belongs to the authenticated user.
  await projects.get(input.projectId);

  const service = createDevBoardService({ client });
  const ticket = await service.create(input);
  writeTicketOutput(ticket, json);
}

async function runList(args: string[]): Promise<void> {
  const json = hasFlag(args, "--json");
  const projectId = getFlagValue(args, "--project-id")?.trim();
  if (!projectId) {
    fail(
      "Project id is required (--project-id).\n\nUsage: forge-cli ticket list --project-id <id>",
      json,
    );
    return;
  }

  const columnRaw = getFlagValue(args, "--column");
  let columnFilter: ColumnId | undefined;

  if (columnRaw !== undefined) {
    const parsed = parseColumnId(columnRaw);
    if (typeof parsed === "object" && "error" in parsed) {
      fail(parsed.error, json);
      return;
    }
    columnFilter = parsed;
  }

  const service = await createAuthedDevBoardService();
  const tickets = await service.list(projectId, columnFilter);
  writeTicketListOutput(tickets, json);
}

async function runGet(args: string[]): Promise<void> {
  const json = hasFlag(args, "--json");
  const [id] = getPositionals(args);
  if (!id) {
    fail("Missing ticket id.\n\nUsage: forge-cli ticket get <id>", json);
    return;
  }

  const service = await createAuthedDevBoardService();
  const ticket = await service.get(id);
  writeTicketOutput(ticket, json);
}

async function runUpdate(args: string[]): Promise<void> {
  const json = hasFlag(args, "--json");
  const [id] = getPositionals(args);
  if (!id) {
    fail(
      "Missing ticket id.\n\nUsage: forge-cli ticket update <id> [--title …]",
      json,
    );
    return;
  }

  const raw: Record<string, unknown> = {};
  const title = getFlagValue(args, "--title");
  const description = getFlagValue(args, "--description");
  const priority = getFlagValue(args, "--priority");
  const branch = getFlagValue(args, "--branch");
  const prUrl = getFlagValue(args, "--pr-url");

  if (title !== undefined) raw.title = title;
  if (description !== undefined) raw.description = description;
  if (priority !== undefined) raw.priority = priority;
  if (branch !== undefined) raw.branch = branch;
  if (prUrl !== undefined) raw.prUrl = prUrl;
  if (hasFlag(args, "--clear-branch")) raw.clearBranch = true;
  if (hasFlag(args, "--clear-pr-url")) raw.clearPrUrl = true;

  const input = parseTicketUpdateInput(raw);
  if ("error" in input) {
    fail(input.error, json);
    return;
  }

  const service = await createAuthedDevBoardService();
  const ticket = await service.update(id, input);
  writeTicketOutput(ticket, json);
}

async function runDelete(args: string[]): Promise<void> {
  const json = hasFlag(args, "--json");
  const [id] = getPositionals(args);
  if (!id) {
    fail("Missing ticket id.\n\nUsage: forge-cli ticket delete <id>", json);
    return;
  }

  const service = await createAuthedDevBoardService();
  await service.delete(id);
  writeDeletedOutput("ticket", id, json);
}

async function runMove(args: string[]): Promise<void> {
  const json = hasFlag(args, "--json");
  const [id] = getPositionals(args);
  const column = getFlagValue(args, "--column");

  const input = parseTicketMoveInput({
    id: id ?? "",
    column,
    branch: getFlagValue(args, "--branch"),
    prUrl: getFlagValue(args, "--pr-url"),
    clearBranch: hasFlag(args, "--clear-branch"),
    clearPrUrl: hasFlag(args, "--clear-pr-url"),
  });
  if ("error" in input) {
    fail(input.error, json);
    return;
  }

  const service = await createAuthedDevBoardService();
  const ticket = await service.move(input);
  writeTicketOutput(ticket, json);
}

async function runNext(args: string[]): Promise<void> {
  const json = hasFlag(args, "--json");
  const projectId = getFlagValue(args, "--project-id")?.trim();

  const service = await createAuthedDevBoardService();
  const context = await service.next(projectId ? { projectId } : {});
  writeNextContextOutput(context, json);
}

async function runComment(args: string[]): Promise<void> {
  const json = hasFlag(args, "--json");
  const [id] = getPositionals(args);
  if (!id) {
    fail(
      "Missing ticket id.\n\nUsage: forge-cli ticket comment <id> --body <text>",
      json,
    );
    return;
  }

  const input = parseTicketCommentInput({
    body: getFlagValue(args, "--body"),
    author: getFlagValue(args, "--author"),
  });
  if ("error" in input) {
    fail(input.error, json);
    return;
  }

  const service = await createAuthedDevBoardService();
  const comment = await service.addComment(id, input.body, input.author);
  writeCommentOutput(comment, json);
}

async function runComments(args: string[]): Promise<void> {
  const json = hasFlag(args, "--json");
  const [id] = getPositionals(args);
  if (!id) {
    fail("Missing ticket id.\n\nUsage: forge-cli ticket comments <id>", json);
    return;
  }

  const service = await createAuthedDevBoardService();
  const comments = await service.listComments(id);
  writeCommentListOutput(comments, json);
}

export async function runTicket(args: string[]): Promise<void> {
  if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
    process.stdout.write(`${TICKET_HELP}\n`);
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
    case "move":
      await runMove(rest);
      return;
    case "next":
      await runNext(rest);
      return;
    case "comment":
      await runComment(rest);
      return;
    case "comments":
      await runComments(rest);
      return;
    default:
      fail(
        `Unknown ticket command: ${subcommand}\n\n${TICKET_HELP}`,
        hasFlag(args, "--json"),
      );
  }
}

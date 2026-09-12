import { describe, expect, it, vi } from "vitest";
import {
  formatBookmarkJson,
  formatBookmarkListJson,
  formatBookmarkListText,
  formatBookmarkText,
  formatCommentJson,
  formatCommentListJson,
  formatCommentListText,
  formatCommentText,
  formatDeletedJson,
  formatNextContextJson,
  formatNextContextText,
  formatProjectJson,
  formatProjectListJson,
  formatProjectListText,
  formatProjectText,
  formatResourceJson,
  formatResourceListJson,
  formatResourceListText,
  formatResourceText,
  formatTicketJson,
  formatTicketListJson,
  formatTicketListText,
  formatTicketText,
  writeDeletedOutput,
  writeErrorOutput,
} from "../../src/format.js";
import type {
  Bookmark,
  NextTicketContext,
  Project,
  Resource,
  Ticket,
  TicketComment,
} from "@forge/core";

const sampleBookmark: Bookmark = {
  id: "row1",
  title: "React docs",
  url: "https://react.dev",
  category: "docs",
  description: "Official React documentation",
  tags: ["react", "docs"],
  createdAt: "2026-01-01T00:00:00.000Z",
};

const sampleTicket: Ticket = {
  id: "t1",
  projectId: "p1",
  title: "Ship CLI tickets",
  description: "CRUD + move",
  column: "todo",
  position: 1000,
  priority: "high",
  createdAt: "2026-07-18T12:00:00.000Z",
  timerStartedAt: null,
  totalElapsedMs: 65_000,
  isPaused: false,
  lastMovedAt: "2026-07-18T13:00:00.000Z",
  branch: "spec-17-agent-ticket-loop",
  prUrl: "https://github.com/acme/forge/pull/17",
};

const sampleComment: TicketComment = {
  id: "c1",
  ticketId: "t1",
  author: "agent",
  body: "Implemented the loop and moved to review.",
  createdAt: "2026-07-20T10:00:00.000Z",
};

const sampleNextContext: NextTicketContext = {
  ticket: sampleTicket,
  project: { id: "p1", name: "Forge" },
  comments: [sampleComment],
  inProgress: [
    {
      ticket: { ...sampleTicket, id: "t2", column: "in_progress" },
      project: { id: "p1", name: "Forge" },
    },
  ],
};

const sampleProject: Project = {
  id: "p1",
  name: "Forge",
  description: "Dev tools",
  createdAt: "2026-07-19T08:00:00.000Z",
};

const sampleResource: Resource = {
  id: "r1",
  title: "ESLint flat",
  kind: "config",
  content: "{}",
  language: "json",
  tags: ["eslint"],
  tool: "vscode",
  customTool: null,
  version: "9",
  context: "workspace",
  createdAt: "2026-01-01T00:00:00.000Z",
};

describe("formatBookmarkText", () => {
  it("renders a readable bookmark block", () => {
    const text = formatBookmarkText(sampleBookmark);
    expect(text).toContain("id:          row1");
    expect(text).toContain("title:       React docs");
    expect(text).toContain("tags:        react, docs");
  });

  it("shows (none) when tags are empty", () => {
    expect(formatBookmarkText({ ...sampleBookmark, tags: [] })).toContain("tags:        (none)");
  });
});

describe("formatBookmarkListText", () => {
  it("handles an empty list", () => {
    expect(formatBookmarkListText([])).toBe("No bookmarks.");
  });
});

describe("bookmark JSON formatters", () => {
  it("emits parseable bookmark JSON", () => {
    const parsed = JSON.parse(formatBookmarkJson(sampleBookmark)) as Bookmark;
    expect(parsed).toEqual(sampleBookmark);
  });

  it("emits a parseable bookmark array", () => {
    const parsed = JSON.parse(formatBookmarkListJson([sampleBookmark])) as Bookmark[];
    expect(parsed).toEqual([sampleBookmark]);
  });
});

describe("formatTicketText", () => {
  it("renders id, projectId, title, column, priority, and timer summary", () => {
    const text = formatTicketText(sampleTicket);
    expect(text).toContain("id:          t1");
    expect(text).toContain("projectId:   p1");
    expect(text).toContain("title:       Ship CLI tickets");
    expect(text).toContain("column:      todo");
    expect(text).toContain("priority:    high");
    expect(text).toContain("timer:       stopped (logged 1:05)");
  });

  it("shows running and paused timer states", () => {
    expect(
      formatTicketText({
        ...sampleTicket,
        timerStartedAt: "2026-07-18T14:00:00.000Z",
        totalElapsedMs: 3_600_000,
      }),
    ).toContain("timer:       running (logged 1:00:00)");

    expect(
      formatTicketText({
        ...sampleTicket,
        isPaused: true,
        totalElapsedMs: 0,
      }),
    ).toContain("timer:       paused (logged 0:00)");
  });

  it("shows (none) for empty description", () => {
    expect(formatTicketText({ ...sampleTicket, description: "" })).toContain("description: (none)");
  });

  it("renders branch and prUrl, with (none) when empty", () => {
    expect(formatTicketText(sampleTicket)).toContain("branch:      spec-17-agent-ticket-loop");
    expect(formatTicketText(sampleTicket)).toContain(
      "prUrl:       https://github.com/acme/forge/pull/17",
    );

    const cleared = formatTicketText({
      ...sampleTicket,
      branch: null,
      prUrl: null,
    });
    expect(cleared).toContain("branch:      (none)");
    expect(cleared).toContain("prUrl:       (none)");
  });
});

describe("formatTicketListText", () => {
  it("handles an empty list", () => {
    expect(formatTicketListText([])).toBe("No tickets.");
  });
});

describe("ticket JSON formatters", () => {
  it("emits parseable ticket JSON", () => {
    const parsed = JSON.parse(formatTicketJson(sampleTicket)) as Ticket;
    expect(parsed).toEqual(sampleTicket);
  });

  it("emits a parseable ticket array (list --json)", () => {
    const parsed = JSON.parse(formatTicketListJson([sampleTicket])) as Ticket[];
    expect(parsed).toEqual([sampleTicket]);
  });
});

describe("comment formatters", () => {
  it("renders a readable comment block", () => {
    const text = formatCommentText(sampleComment);
    expect(text).toContain("id:        c1");
    expect(text).toContain("author:    agent");
    expect(text).toContain("body:      Implemented the loop and moved to review.");
    expect(text).toContain("createdAt: 2026-07-20T10:00:00.000Z");
  });

  it("handles an empty comment list", () => {
    expect(formatCommentListText([])).toBe("No comments.");
  });

  it("joins comments with a blank line", () => {
    const other: TicketComment = { ...sampleComment, id: "c2", author: "user" };
    const text = formatCommentListText([sampleComment, other]);
    expect(text).toContain("id:        c1");
    expect(text).toContain("id:        c2");
    expect(text).toContain("\n\n");
  });

  it("emits parseable comment JSON", () => {
    const parsed = JSON.parse(formatCommentJson(sampleComment)) as TicketComment;
    expect(parsed).toEqual(sampleComment);

    const list = JSON.parse(formatCommentListJson([sampleComment])) as TicketComment[];
    expect(list).toEqual([sampleComment]);
  });
});

describe("formatNextContextText", () => {
  it("renders the pending ticket, project, comments, and in-progress warning", () => {
    const text = formatNextContextText(sampleNextContext);
    expect(text).toContain("ticket:      t1");
    expect(text).toContain("title:       Ship CLI tickets");
    expect(text).toContain("project:     Forge (p1)");
    expect(text).toContain("priority:    high");
    expect(text).toContain("comments:    1");
    expect(text).toContain("inProgress:  1 ticket(s) in progress (not eligible)");
    expect(text).toContain("Implemented the loop and moved to review.");
  });

  it("handles no pending tickets and still warns about in-progress work", () => {
    const text = formatNextContextText({
      ...sampleNextContext,
      ticket: null,
      project: null,
      comments: [],
    });
    expect(text).toContain("No pending tickets.");
    expect(text).toContain("In progress: 1 ticket(s) in progress (not eligible).");
  });

  it("omits the comments section when there are none", () => {
    const text = formatNextContextText({
      ...sampleNextContext,
      comments: [],
    });
    expect(text).not.toContain("Comments:");
  });
});

describe("formatNextContextJson", () => {
  it("emits parseable next context JSON", () => {
    const parsed = JSON.parse(formatNextContextJson(sampleNextContext)) as NextTicketContext;
    expect(parsed).toEqual(sampleNextContext);
  });
});

describe("delete and error outputs", () => {
  it("emits the machine-readable delete shape", () => {
    const parsed = JSON.parse(formatDeletedJson("t1")) as {
      deleted: boolean;
      id: string;
    };
    expect(parsed).toEqual({ deleted: true, id: "t1" });
  });

  it("writes plain text deletes without --json", () => {
    const spy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    writeDeletedOutput("ticket", "t1", false);
    expect(spy).toHaveBeenCalledWith("Deleted ticket t1\n");
    spy.mockRestore();
  });

  it("writes the machine-readable delete shape with --json", () => {
    const spy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    writeDeletedOutput("ticket", "t1", true);
    expect(spy).toHaveBeenCalledWith(`${JSON.stringify({ deleted: true, id: "t1" }, null, 2)}\n`);
    spy.mockRestore();
  });

  it("writes plain text errors without --json", () => {
    const spy = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
    writeErrorOutput("Something failed.", false);
    expect(spy).toHaveBeenCalledWith("Something failed.\n");
    spy.mockRestore();
  });

  it("writes the machine-readable error shape with --json", () => {
    const spy = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
    writeErrorOutput("Something failed.", true);
    expect(spy).toHaveBeenCalledWith('{"error":{"message":"Something failed."}}\n');
    spy.mockRestore();
  });
});

describe("formatProjectText", () => {
  it("renders id, name, description, and createdAt", () => {
    const text = formatProjectText(sampleProject);
    expect(text).toContain("id:          p1");
    expect(text).toContain("name:        Forge");
    expect(text).toContain("description: Dev tools");
    expect(text).toContain("createdAt:   2026-07-19T08:00:00.000Z");
  });

  it("shows (none) for empty description", () => {
    expect(formatProjectText({ ...sampleProject, description: "" })).toContain(
      "description: (none)",
    );
  });

  it("shortens long descriptions in text output", () => {
    const long = "x".repeat(100);
    const text = formatProjectText({ ...sampleProject, description: long });
    expect(text).toContain("description: ");
    expect(text).toContain("…");
    expect(text).not.toContain(long);
  });
});

describe("formatProjectListText", () => {
  it("handles an empty list", () => {
    expect(formatProjectListText([])).toBe("No projects.");
  });
});

describe("project JSON formatters", () => {
  it("emits parseable project JSON", () => {
    const parsed = JSON.parse(formatProjectJson(sampleProject)) as Project;
    expect(parsed).toEqual(sampleProject);
  });

  it("emits a parseable project array (list --json)", () => {
    const parsed = JSON.parse(formatProjectListJson([sampleProject])) as Project[];
    expect(parsed).toEqual([sampleProject]);
  });
});

describe("formatResourceText", () => {
  it("renders a readable resource block", () => {
    const text = formatResourceText(sampleResource);
    expect(text).toContain("id:          r1");
    expect(text).toContain("title:       ESLint flat");
    expect(text).toContain("kind:        config");
    expect(text).toContain("tool:        vscode");
    expect(text).toContain("tags:        eslint");
  });

  it("shows (none) for empty optional fields", () => {
    expect(
      formatResourceText({
        ...sampleResource,
        language: null,
        tags: [],
        tool: null,
        customTool: null,
        version: null,
        context: null,
      }),
    ).toContain("language:    (none)");
  });
});

describe("formatResourceListText", () => {
  it("handles an empty list", () => {
    expect(formatResourceListText([])).toBe("No resources.");
  });
});

describe("resource JSON formatters", () => {
  it("emits parseable resource JSON", () => {
    const parsed = JSON.parse(formatResourceJson(sampleResource)) as Resource;
    expect(parsed).toEqual(sampleResource);
  });

  it("emits a parseable resource array", () => {
    const parsed = JSON.parse(formatResourceListJson([sampleResource])) as Resource[];
    expect(parsed).toEqual([sampleResource]);
  });
});

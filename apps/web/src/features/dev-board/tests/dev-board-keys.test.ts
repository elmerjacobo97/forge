import { describe, expect, it } from "vitest";

import { devBoardKeys } from "../hooks/queries";

describe("devBoardKeys", () => {
  it("scopes project list under the user", () => {
    expect(devBoardKeys.projects("user-1")).toEqual(["dev-board", "user-1", "projects"]);
  });

  it("includes projectId in column and analytics keys", () => {
    expect(devBoardKeys.column("user-1", "project-1", "todo")).toEqual([
      "dev-board",
      "user-1",
      "project",
      "project-1",
      "todo",
    ]);
    expect(devBoardKeys.analytics("user-1", "project-1", "from", "to")).toEqual([
      "dev-board",
      "user-1",
      "project",
      "project-1",
      "analytics",
      "from",
      "to",
    ]);
  });
});

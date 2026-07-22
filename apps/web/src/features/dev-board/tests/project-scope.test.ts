import { describe, expect, it } from "vitest";

import { filterRowsForTickets, ticketIdSet } from "../utils/project-scope";

describe("project-scope", () => {
  it("builds a set of ticket ids", () => {
    expect(ticketIdSet([{ id: "a" }, { id: "b" }, { id: "a" }])).toEqual(new Set(["a", "b"]));
  });

  it("keeps only rows that belong to the project's tickets", () => {
    const rows = [
      { ticketId: "a", value: 1 },
      { ticketId: "b", value: 2 },
      { ticketId: "c", value: 3 },
    ];
    expect(filterRowsForTickets(rows, new Set(["a", "c"]))).toEqual([
      { ticketId: "a", value: 1 },
      { ticketId: "c", value: 3 },
    ]);
  });

  it("returns no rows when the project has no tickets", () => {
    expect(filterRowsForTickets([{ ticketId: "a", value: 1 }], new Set())).toEqual([]);
  });
});

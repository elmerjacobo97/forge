import { describe, expect, it } from "vitest";

import {
  assertProjectHasNoTickets,
  PROJECT_HAS_TICKETS_MESSAGE,
} from "../utils/project-delete";

describe("assertProjectHasNoTickets", () => {
  it("allows delete when there are no tickets", () => {
    expect(() => assertProjectHasNoTickets(0)).not.toThrow();
  });

  it("blocks delete when tickets remain", () => {
    expect(() => assertProjectHasNoTickets(1)).toThrow(PROJECT_HAS_TICKETS_MESSAGE);
    expect(() => assertProjectHasNoTickets(12)).toThrow(PROJECT_HAS_TICKETS_MESSAGE);
  });
});

import { describe, expect, it } from "vitest"
import { mapRowToTicket } from "./dev-board-service.js"
import { mapRowToProject } from "./projects-service.js"

describe("InsForge row mapping", () => {
  it("maps project snake_case fields to stable CLI fields", () => {
    expect(
      mapRowToProject({
        id: "project-1",
        name: "Forge",
        description: "Developer tools",
        created_at: "2026-07-20T00:00:00.000Z",
      }),
    ).toEqual({
      id: "project-1",
      name: "Forge",
      description: "Developer tools",
      createdAt: "2026-07-20T00:00:00.000Z",
    })
  })

  it("maps and validates ticket RPC output", () => {
    const row = {
      id: "ticket-1",
      project_id: "project-1",
      title: "Migrate CLI",
      description: "Use InsForge",
      column_id: "in_progress",
      position: 0,
      priority: "high",
      created_at: "2026-07-20T00:00:00.000Z",
      timer_started_at: "2026-07-20T00:01:00.000Z",
      total_elapsed_ms: 1000,
      is_paused: false,
      last_moved_at: "2026-07-20T00:01:00.000Z",
    }

    expect(mapRowToTicket(row)).toMatchObject({
      id: "ticket-1",
      projectId: "project-1",
      column: "in_progress",
      priority: "high",
      totalElapsedMs: 1000,
    })
    expect(() => mapRowToTicket({ ...row, position: "0" })).toThrow(
      /position must be a number/,
    )
  })
})

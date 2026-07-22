import { describe, expect, it } from "vitest"
import { parseConfig } from "./config.js"
import { parseSession } from "./session.js"

describe("InsForge config and session parsing", () => {
  it("normalizes the backend URL", () => {
    expect(
      parseConfig({ url: " https://forge.insforge.app/ ", anonKey: " anon " }),
    ).toEqual({
      url: "https://forge.insforge.app",
      anonKey: "anon",
    })
  })

  it("rejects legacy Appwrite config", () => {
    expect(() =>
      parseConfig({ endpoint: "https://appwrite.example", projectId: "old" }),
    ).toThrow(/url and anonKey are required/)
  })

  it("requires both Node-mode tokens", () => {
    expect(
      parseSession({
        userId: "user-1",
        accessToken: "access",
        refreshToken: "refresh",
      }),
    ).toEqual({
      userId: "user-1",
      accessToken: "access",
      refreshToken: "refresh",
    })
    expect(() =>
      parseSession({ userId: "user-1", accessToken: "access" }),
    ).toThrow(/refreshToken/)
  })
})

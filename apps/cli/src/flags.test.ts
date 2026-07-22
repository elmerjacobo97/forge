import { describe, expect, it } from "vitest"
import {
  getFlagValue,
  getPositionals,
  hasFlag,
  parseTagsFlag,
} from "./flags.js"

describe("getFlagValue", () => {
  it("reads a value flag", () => {
    expect(
      getFlagValue(["--title", "Docs", "--url", "https://example.com"], "--title"),
    ).toBe("Docs")
  })

  it("returns undefined when the flag is missing or has no value", () => {
    expect(getFlagValue(["--title"], "--title")).toBeUndefined()
    expect(getFlagValue(["--json"], "--title")).toBeUndefined()
  })
})

describe("hasFlag / getPositionals", () => {
  it("detects --json without consuming the bookmark id", () => {
    const args = ["abc123", "--json", "--title", "Hi"]
    expect(hasFlag(args, "--json")).toBe(true)
    expect(getPositionals(args)).toEqual(["abc123"])
  })

  it("skips valued flags when collecting positionals", () => {
    expect(
      getPositionals(["--title", "Docs", "row-id", "--tags", "a,b"]),
    ).toEqual(["row-id"])
  })
})

describe("parseTagsFlag", () => {
  it("splits comma-separated tags and trims whitespace", () => {
    expect(parseTagsFlag(" react, hooks ,docs ")).toEqual([
      "react",
      "hooks",
      "docs",
    ])
  })

  it("returns an empty array for missing or blank input", () => {
    expect(parseTagsFlag(undefined)).toEqual([])
    expect(parseTagsFlag("")).toEqual([])
    expect(parseTagsFlag("   ")).toEqual([])
  })
})

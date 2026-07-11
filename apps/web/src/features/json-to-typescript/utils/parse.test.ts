import { describe, it, expect } from "vitest"
import { sanitizeJson, parseSamples } from "./parse"

describe("sanitizeJson", () => {
  it("removes single-line comments", () => {
    const result = sanitizeJson('{\n  // comment\n  "a": 1\n}')
    expect(result).not.toContain("//")
    expect(JSON.parse(result)).toEqual({ a: 1 })
  })

  it("removes multi-line comments", () => {
    const result = sanitizeJson('{\n  /* comment */\n  "a": 1\n}')
    expect(result).not.toContain("/*")
    expect(JSON.parse(result)).toEqual({ a: 1 })
  })

  it("removes trailing commas", () => {
    const result = sanitizeJson('{"a": 1,}')
    expect(result).not.toContain(",}")
    expect(JSON.parse(result)).toEqual({ a: 1 })
  })
})

describe("parseSamples", () => {
  it("returns empty for empty input", () => {
    expect(parseSamples("")).toEqual({ samples: [], error: null })
  })

  it("parses object", () => {
    const result = parseSamples('{"a": 1}')
    expect(result.error).toBeNull()
    expect(result.samples).toEqual([{ a: 1 }])
  })

  it("parses array", () => {
    const result = parseSamples('[{"a": 1}, {"a": 2}]')
    expect(result.error).toBeNull()
    expect(result.samples).toEqual([{ a: 1 }, { a: 2 }])
  })

  it("returns error for invalid JSON", () => {
    const result = parseSamples("{invalid}")
    expect(result.error).not.toBeNull()
    expect(result.samples).toEqual([])
  })

  it("handles sanitizable input (comments)", () => {
    const result = parseSamples('{\n  // comment\n  "a": 1\n}')
    expect(result.error).toBeNull()
    expect(result.samples).toEqual([{ a: 1 }])
  })
})

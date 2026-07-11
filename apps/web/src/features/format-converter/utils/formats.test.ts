import { describe, it, expect } from "vitest"
import { convert } from "./formats"

describe("convert", () => {
  it("returns empty for empty input", () => {
    const result = convert("", "json", "yaml")
    expect(result).toEqual({ output: "", error: null })
  })

  it("returns input when from === to", () => {
    const result = convert('{"a":1}', "json", "json")
    expect(result).toEqual({ output: '{"a":1}', error: null })
  })

  it("round-trips json → yaml → json", () => {
    const toYaml = convert('{"name":"test","value":42}', "json", "yaml")
    expect(toYaml.error).toBeNull()
    const backToJson = convert(toYaml.output, "yaml", "json")
    expect(backToJson.error).toBeNull()
    expect(JSON.parse(backToJson.output)).toEqual({ name: "test", value: 42 })
  })

  it("round-trips json → toml → json", () => {
    const toToml = convert('{"name":"test","value":42}', "json", "toml")
    expect(toToml.error).toBeNull()
    const backToJson = convert(toToml.output, "toml", "json")
    expect(backToJson.error).toBeNull()
    expect(JSON.parse(backToJson.output)).toEqual({ name: "test", value: 42 })
  })

  it("returns error for invalid input", () => {
    const result = convert("{invalid}", "json", "yaml")
    expect(result.error).not.toBeNull()
    expect(result.output).toBe("")
  })

  it("handles nested objects", () => {
    const input = JSON.stringify({ a: { b: { c: [1, 2, 3] } } })
    const toYaml = convert(input, "json", "yaml")
    expect(toYaml.error).toBeNull()
    expect(toYaml.output).toContain("a:")
    expect(toYaml.output).toContain("b:")
  })
})

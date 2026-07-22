import { describe, it, expect } from "vitest"
import { generateTypeScript } from "./printer"

describe("generateTypeScript", () => {
  it("generates interface for object", () => {
    const result = generateTypeScript('{"name":"Alice","age":30}', {
      mode: "interface",
      rootName: "User",
      detectDates: false,
      optionalNulls: false,
      enumThreshold: 10,
    })
    expect(result.error).toBeNull()
    expect(result.output).toContain("interface User")
    expect(result.output).toContain("name")
    expect(result.output).toContain("age")
  })

  it("generates type alias", () => {
    const result = generateTypeScript('{"name":"Alice"}', {
      mode: "type",
      rootName: "User",
      detectDates: false,
      optionalNulls: false,
      enumThreshold: 10,
    })
    expect(result.error).toBeNull()
    expect(result.output).toContain("type User")
  })

  it("handles array input", () => {
    const result = generateTypeScript('[{"a":1}]', {
      mode: "interface",
      rootName: "Root",
      detectDates: false,
      optionalNulls: false,
      enumThreshold: 10,
    })
    expect(result.error).toBeNull()
    expect(result.output).toContain("Root")
  })

  it("returns error for invalid input", () => {
    const result = generateTypeScript("{invalid}", {
      mode: "interface",
      rootName: "Root",
      detectDates: false,
      optionalNulls: false,
      enumThreshold: 10,
    })
    expect(result.error).not.toBeNull()
  })
})

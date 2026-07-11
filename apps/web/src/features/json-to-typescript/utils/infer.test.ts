import { describe, it, expect } from "vitest"
import { inferType, inferFromSamples, mergeTypes } from "./infer"
import type { InferOptions } from "./infer"

const opts: InferOptions = { detectDates: false, optionalNulls: false, enumThreshold: 10 }

describe("inferType", () => {
  it("infers null", () => {
    const t = inferType(null, opts)
    expect(t.kind).toBe("primitive")
    if (t.kind === "primitive") expect(t.name).toBe("null")
  })

  it("infers boolean", () => {
    const t = inferType(true, opts)
    expect(t.kind).toBe("primitive")
    if (t.kind === "primitive") expect(t.name).toBe("boolean")
  })

  it("infers number", () => {
    const t = inferType(42, opts)
    expect(t.kind).toBe("primitive")
    if (t.kind === "primitive") expect(t.name).toBe("number")
  })

  it("infers string as literal", () => {
    const t = inferType("hello", opts)
    expect(t.kind).toBe("literal")
  })

  it("infers Date when detectDates is true", () => {
    const t = inferType("2024-01-15T00:00:00Z", { ...opts, detectDates: true })
    expect(t.kind).toBe("primitive")
    if (t.kind === "primitive") expect(t.name).toBe("Date")
  })

  it("infers empty array", () => {
    const t = inferType([], opts)
    expect(t.kind).toBe("array")
    if (t.kind === "array" && t.element.kind === "primitive") expect(t.element.name).toBe("any")
  })

  it("infers array of numbers", () => {
    const t = inferType([1, 2, 3], opts)
    expect(t.kind).toBe("array")
    if (t.kind === "array" && t.element.kind === "primitive") expect(t.element.name).toBe("number")
  })

  it("infers object", () => {
    const t = inferType({ name: "Alice", age: 30 }, opts)
    expect(t.kind).toBe("object")
    if (t.kind === "object") {
      expect(t.properties.name).toBeDefined()
      expect(t.properties.age).toBeDefined()
    }
  })

  it("infers nested object", () => {
    const t = inferType({ user: { name: "Bob" } }, opts)
    expect(t.kind).toBe("object")
    if (t.kind === "object") {
      const userProp = t.properties.user
      expect(userProp.type.kind).toBe("object")
    }
  })
})

describe("inferFromSamples", () => {
  it("returns any for empty array", () => {
    const t = inferFromSamples([], opts)
    expect(t.kind).toBe("primitive")
    if (t.kind === "primitive") expect(t.name).toBe("any")
  })

  it("merges multiple samples", () => {
    const t = inferFromSamples([{ a: 1 }, { a: "hello" }], opts)
    expect(t.kind).toBe("object")
  })
})

describe("mergeTypes", () => {
  it("merges same type", () => {
    const t = mergeTypes([inferType(1, opts), inferType(2, opts)], opts)
    expect(t.kind).toBe("primitive")
    if (t.kind === "primitive") expect(t.name).toBe("number")
  })

  it("returns union for different types", () => {
    const t = mergeTypes([inferType(1, opts), inferType("hello", opts)], opts)
    expect(t.kind === "union" || (t.kind === "primitive")).toBe(true)
  })
})

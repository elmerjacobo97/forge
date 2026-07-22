import { describe, it, expect } from "vitest"
import { encodeHtml, decodeHtml } from "./html-entities"

describe("encodeHtml", () => {
  it("encodes with named entities", () => {
    expect(encodeHtml("<div>", "named")).toBe("&lt;div&gt;")
    expect(encodeHtml('"hello"', "named")).toBe("&quot;hello&quot;")
  })

  it("encodes with decimal entities (<> use named fallback)", () => {
    expect(encodeHtml("<div>", "decimal")).toBe("&lt;div&gt;")
  })

  it("encodes with hex entities (<> use named fallback)", () => {
    expect(encodeHtml("<div>", "hex")).toBe("&lt;div&gt;")
  })

  it("encodes high-codepoint characters", () => {
    expect(encodeHtml("©", "named")).toBe("&copy;")
    expect(encodeHtml("©", "decimal")).toBe("&#169;")
    // hex mode uses lowercase for codePointAt(0).toString(16)
    expect(encodeHtml("©", "hex")).toBe("&#xa9;")
  })

  it("leaves ASCII safe characters alone (named mode)", () => {
    expect(encodeHtml("hello world", "named")).toBe("hello world")
  })
})

describe("decodeHtml", () => {
  it("decodes named entities", () => {
    const result = decodeHtml("&lt;div&gt;")
    expect(result.error).toBeNull()
    expect(result.output).toBe("<div>")
  })

  it("decodes decimal entities", () => {
    const result = decodeHtml("&#60;div&#62;")
    expect(result.error).toBeNull()
    expect(result.output).toBe("<div>")
  })

  it("decodes hex entities", () => {
    const result = decodeHtml("&#x3C;div&#x3E;")
    expect(result.error).toBeNull()
    expect(result.output).toBe("<div>")
  })

  it("round-trips encode → decode", () => {
    const original = '<div class="test">Hello & goodbye © 2024</div>'
    const encoded = encodeHtml(original, "named")
    const decoded = decodeHtml(encoded)
    expect(decoded.error).toBeNull()
    expect(decoded.output).toBe(original)
  })

  it("reports error for invalid entity", () => {
    const result = decodeHtml("hello &unknown; world")
    expect(result.error).toBe("Some entities could not be decoded")
  })

  it("passes through invalid entity in output", () => {
    const result = decodeHtml("hello &unknown;")
    expect(result.output).toContain("&unknown;")
  })
})

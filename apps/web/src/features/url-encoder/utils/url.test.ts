import { describe, it, expect } from "vitest"
import { encodeUrl, decodeUrl } from "./url"

describe("encodeUrl", () => {
  it("encodes special characters", () => {
    expect(encodeUrl("hello world")).toBe("hello%20world")
    expect(encodeUrl("a&b=c")).toBe("a%26b%3Dc")
  })

  it("leaves unreserved characters alone", () => {
    expect(encodeUrl("abc123")).toBe("abc123")
  })

  it("encodes unicode", () => {
    expect(encodeUrl("héllo")).toContain("%")
  })

  it("handles empty string", () => {
    expect(encodeUrl("")).toBe("")
  })
})

describe("decodeUrl", () => {
  it("decodes percent-encoded", () => {
    const result = decodeUrl("hello%20world")
    expect(result.error).toBeNull()
    expect(result.output).toBe("hello world")
  })

  it("handles already decoded string", () => {
    const result = decodeUrl("hello")
    expect(result.error).toBeNull()
    expect(result.output).toBe("hello")
  })

  it("returns error for invalid encoding", () => {
    const result = decodeUrl("%ZZ")
    expect(result.error).toBe("Invalid percent-encoding")
    expect(result.output).toBe("")
  })

  it("round-trips encode → decode", () => {
    const original = "a&b=c d@e!f"
    const encoded = encodeUrl(original)
    const decoded = decodeUrl(encoded)
    expect(decoded.error).toBeNull()
    expect(decoded.output).toBe(original)
  })
})

import { describe, it, expect } from "vitest"
import { decodeJwt, formatTimestampClaim } from "./jwt"

describe("decodeJwt", () => {
  it("decodes a valid JWT", () => {
    // {"alg":"HS256","typ":"JWT"} . {"sub":"123","name":"John"} . signature
    const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }))
    const payload = btoa(JSON.stringify({ sub: "123", name: "John" }))
    const token = `${header}.${payload}.fakesig`
    const result = decodeJwt(token)
    expect(result).not.toBeNull()
    expect(result!.header.alg).toBe("HS256")
    expect(result!.payload.sub).toBe("123")
    expect(result!.payload.name).toBe("John")
    expect(result!.signature).toBe("fakesig")
  })

  it("returns null for malformed token (wrong parts)", () => {
    expect(decodeJwt("part1.part2")).toBeNull()
    expect(decodeJwt("")).toBeNull()
  })

  it("returns null for invalid base64", () => {
    expect(decodeJwt("!!!.!!!.!!!")).toBeNull()
  })

  it("returns null for non-JSON header", () => {
    const token = `${btoa("not-json")}.${btoa("{}")}.sig`
    expect(decodeJwt(token)).toBeNull()
  })

  it("decodes base64url-encoded token", () => {
    const header = btoa(JSON.stringify({ alg: "HS256" }))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "")
    const payload = btoa(JSON.stringify({ sub: "456" }))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "")
    const token = `${header}.${payload}.sig`
    const result = decodeJwt(token)
    expect(result).not.toBeNull()
    expect(result!.payload.sub).toBe("456")
  })
})

describe("formatTimestampClaim", () => {
  it("formats valid timestamp", () => {
    const result = formatTimestampClaim(1700000000)
    expect(result).toMatch(/^202\d/)
  })

  it("returns null for non-number", () => {
    expect(formatTimestampClaim("string")).toBeNull()
    expect(formatTimestampClaim(null)).toBeNull()
  })

  it("returns null for NaN", () => {
    expect(formatTimestampClaim(NaN)).toBeNull()
  })
})

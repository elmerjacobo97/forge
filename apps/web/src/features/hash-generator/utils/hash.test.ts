import { describe, it, expect } from "vitest"
import { digest } from "./hash"

describe("digest", () => {
  it("MD5 of empty string", async () => {
    const result = await digest("md5", "")
    expect(result).toBe("d41d8cd98f00b204e9800998ecf8427e")
  })

  it("MD5 of 'abc' (known vector)", async () => {
    const result = await digest("md5", "abc")
    expect(result).toHaveLength(32)
    expect(result).toMatch(/^[0-9a-f]{32}$/)
  })

  it("SHA-256 is consistent", async () => {
    const result = await digest("sha-256", "hello")
    expect(result).toHaveLength(64)
    expect(result).toMatch(/^[0-9a-f]{64}$/)
  })

  it("SHA-1 is consistent", async () => {
    const result = await digest("sha-1", "hello")
    expect(result).toHaveLength(40)
    expect(result).toMatch(/^[0-9a-f]{40}$/)
  })

  it("different inputs produce different hashes", async () => {
    const a = await digest("md5", "foo")
    const b = await digest("md5", "bar")
    expect(a).not.toBe(b)
  })
})

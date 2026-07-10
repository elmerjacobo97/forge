import { describe, it, expect } from "vitest"
import { formatSize, pctOf } from "./format"

describe("formatSize", () => {
  it("formats 0 bytes", () => {
    expect(formatSize(0)).toBe("0 B")
  })

  it("formats bytes", () => {
    expect(formatSize(500)).toBe("500 B")
  })

  it("formats KB", () => {
    expect(formatSize(1024)).toBe("1.0 KB")
  })

  it("formats MB", () => {
    expect(formatSize(1048576)).toBe("1.0 MB")
  })

  it("formats GB", () => {
    expect(formatSize(1073741824)).toBe("1.0 GB")
  })
})

describe("pctOf", () => {
  it("returns empty when either is 0", () => {
    expect(pctOf(0, 100)).toBe("")
    expect(pctOf(100, 0)).toBe("")
  })

  it("shows positive percentage increase", () => {
    expect(pctOf(100, 150)).toBe("+50%")
  })

  it("shows negative percentage decrease", () => {
    expect(pctOf(200, 100)).toBe("-50%")
  })

  it("shows 0% when equal", () => {
    expect(pctOf(100, 100)).toBe("+0%")
  })
})

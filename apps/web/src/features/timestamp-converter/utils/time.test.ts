import { describe, it, expect } from "vitest"
import { safeFormat, formatRelative } from "./time"

const epoch = new Date(0)

describe("safeFormat", () => {
  it("formats date with a pattern", () => {
    const result = safeFormat(epoch, "yyyy")
    expect(result).toMatch(/1969|1970/)
  })

  it("formats time", () => {
    const result = safeFormat(epoch, "HH:mm")
    expect(result).toMatch(/\d{2}:\d{2}/)
  })
})

describe("formatRelative", () => {
  it("handles past dates", () => {
    const past = new Date(Date.now() - 60_000)
    const result = formatRelative(past)
    expect(result).toMatch(/ago/)
  })

  it("handles future dates", () => {
    const future = new Date(Date.now() + 60_000)
    const result = formatRelative(future)
    expect(result).toMatch(/in /)
  })

  it("handles very old dates", () => {
    const old = new Date(0)
    const result = formatRelative(old)
    expect(result).toBeTruthy()
  })
})

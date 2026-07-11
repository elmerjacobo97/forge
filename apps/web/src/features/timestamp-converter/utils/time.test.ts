import { describe, it, expect } from "vitest"
import { safeFormat, formatRelative } from "./time"

const epoch = new Date(0)

describe("safeFormat", () => {
  it("formats date with options", () => {
    const result = safeFormat(epoch, {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
    expect(result).toBeTruthy()
    expect(result).toMatch(/\d{4}/)
  })

  it("formats time", () => {
    const result = safeFormat(epoch, {
      hour: "2-digit",
      minute: "2-digit",
    })
    expect(result).toMatch(/\d{2}:\d{2}/)
  })
})

describe("formatRelative", () => {
  it("handles past dates", () => {
    const past = new Date(Date.now() - 60_000)
    const result = formatRelative(past)
    expect(result).toMatch(/minute/)
  })

  it("handles future dates", () => {
    const future = new Date(Date.now() + 60_000)
    const result = formatRelative(future)
    expect(result).toMatch(/minute/)
  })

  it("handles very old dates", () => {
    const old = new Date(0)
    const result = formatRelative(old)
    expect(result).toBeTruthy()
  })
})

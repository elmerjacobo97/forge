import { describe, it, expect } from "vitest"
import { computeLineDiff, formatDiff, diffStats } from "./diff"

describe("computeLineDiff", () => {
  it("returns empty for both empty", () => {
    expect(computeLineDiff("", "")).toEqual([])
  })

  it("detects added lines", () => {
    const result = computeLineDiff("", "a\nb")
    expect(result.every((l) => l.type === "added")).toBe(true)
    expect(result).toHaveLength(2)
    expect(result[0].newNumber).toBe(1)
    expect(result[1].newNumber).toBe(2)
  })

  it("detects removed lines", () => {
    const result = computeLineDiff("a\nb", "")
    expect(result.every((l) => l.type === "removed")).toBe(true)
    expect(result).toHaveLength(2)
  })

  it("detects unchanged lines", () => {
    const result = computeLineDiff("a\nb", "a\nb")
    expect(result.every((l) => l.type === "equal")).toBe(true)
    expect(result).toHaveLength(2)
  })

  it("mixed diff", () => {
    const result = computeLineDiff("a\nb\nc", "a\nd\nc")
    const types = result.map((l) => l.type)
    expect(types).toContain("equal")
    expect(types).toContain("removed")
    expect(types).toContain("added")
  })
})

describe("formatDiff", () => {
  it("formats lines with +/-/space prefix", () => {
    const lines = computeLineDiff("a\nb", "a\nc")
    const formatted = formatDiff(lines)
    expect(formatted).toContain(" a")
    expect(formatted).toContain("-b")
    expect(formatted).toContain("+c")
  })
})

describe("diffStats", () => {
  it("counts correctly", () => {
    const result = computeLineDiff("a\nb\nc", "a\nd\nc")
    const stats = diffStats(result)
    expect(stats.equal).toBeGreaterThanOrEqual(2)
    expect(stats.added).toBe(1)
    expect(stats.removed).toBe(1)
  })

  it("all added", () => {
    const result = computeLineDiff("", "x\ny")
    const stats = diffStats(result)
    expect(stats.equal).toBe(0)
    expect(stats.added).toBe(2)
    expect(stats.removed).toBe(0)
  })
})

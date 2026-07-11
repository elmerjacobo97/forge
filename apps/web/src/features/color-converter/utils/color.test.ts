import { describe, it, expect } from "vitest"
import { hexToRgb, rgbToHex, rgbToHsl, hslToRgb, rgbToOkLch } from "./color"

describe("hexToRgb", () => {
  it("parses 6-digit hex", () => {
    expect(hexToRgb("#ff0000")).toEqual({ r: 255, g: 0, b: 0 })
    expect(hexToRgb("#00ff00")).toEqual({ r: 0, g: 255, b: 0 })
    expect(hexToRgb("#0000ff")).toEqual({ r: 0, g: 0, b: 255 })
    expect(hexToRgb("#ffffff")).toEqual({ r: 255, g: 255, b: 255 })
    expect(hexToRgb("#000000")).toEqual({ r: 0, g: 0, b: 0 })
  })

  it("parses 3-digit hex", () => {
    expect(hexToRgb("#f00")).toEqual({ r: 255, g: 0, b: 0 })
    expect(hexToRgb("#0f0")).toEqual({ r: 0, g: 255, b: 0 })
    expect(hexToRgb("#00f")).toEqual({ r: 0, g: 0, b: 255 })
    expect(hexToRgb("#fff")).toEqual({ r: 255, g: 255, b: 255 })
    expect(hexToRgb("#000")).toEqual({ r: 0, g: 0, b: 0 })
  })

  it("parses hex without hash", () => {
    expect(hexToRgb("ff0000")).toEqual({ r: 255, g: 0, b: 0 })
  })

  it("returns null for invalid input", () => {
    expect(hexToRgb("")).toBeNull()
    expect(hexToRgb("#xyz")).toBeNull()
    expect(hexToRgb("#12345")).toBeNull()
    expect(hexToRgb("nothex")).toBeNull()
  })
})

describe("rgbToHex", () => {
  it("converts rgb to hex", () => {
    expect(rgbToHex({ r: 255, g: 0, b: 0 })).toBe("#ff0000")
    expect(rgbToHex({ r: 0, g: 255, b: 0 })).toBe("#00ff00")
    expect(rgbToHex({ r: 0, g: 0, b: 255 })).toBe("#0000ff")
    expect(rgbToHex({ r: 255, g: 255, b: 255 })).toBe("#ffffff")
    expect(rgbToHex({ r: 0, g: 0, b: 0 })).toBe("#000000")
  })
})

describe("round-trip hex → rgb → hex", () => {
  const cases = ["#ff0000", "#00ff00", "#0000ff", "#ffffff", "#000000", "#aabbcc", "#123456"]
  for (const hex of cases) {
    it(`${hex} round-trips`, () => {
      const rgb = hexToRgb(hex)
      expect(rgb).not.toBeNull()
      expect(rgbToHex(rgb!)).toBe(hex)
    })
  }
})

describe("rgbToHsl", () => {
  it("converts red", () => {
    const hsl = rgbToHsl({ r: 255, g: 0, b: 0 })
    expect(hsl.h).toBe(0)
    expect(hsl.s).toBe(100)
    expect(hsl.l).toBe(50)
  })

  it("converts green", () => {
    const hsl = rgbToHsl({ r: 0, g: 255, b: 0 })
    expect(hsl.h).toBe(120)
    expect(hsl.s).toBe(100)
    expect(hsl.l).toBe(50)
  })

  it("converts blue", () => {
    const hsl = rgbToHsl({ r: 0, g: 0, b: 255 })
    expect(hsl.h).toBe(240)
    expect(hsl.s).toBe(100)
    expect(hsl.l).toBe(50)
  })

  it("converts white", () => {
    const hsl = rgbToHsl({ r: 255, g: 255, b: 255 })
    expect(hsl.h).toBe(0)
    expect(hsl.s).toBe(0)
    expect(hsl.l).toBe(100)
  })

  it("converts black", () => {
    const hsl = rgbToHsl({ r: 0, g: 0, b: 0 })
    expect(hsl.h).toBe(0)
    expect(hsl.s).toBe(0)
    expect(hsl.l).toBe(0)
  })
})

describe("hslToRgb", () => {
  it("converts red", () => {
    const rgb = hslToRgb({ h: 0, s: 100, l: 50 })
    expect(rgb.r).toBe(255)
    expect(rgb.g).toBe(0)
    expect(rgb.b).toBe(0)
  })

  it("converts green", () => {
    const rgb = hslToRgb({ h: 120, s: 100, l: 50 })
    expect(rgb.r).toBe(0)
    expect(rgb.g).toBe(255)
    expect(rgb.b).toBe(0)
  })

  it("converts blue", () => {
    const rgb = hslToRgb({ h: 240, s: 100, l: 50 })
    expect(rgb.r).toBe(0)
    expect(rgb.g).toBe(0)
    expect(rgb.b).toBe(255)
  })

  it("converts white", () => {
    const rgb = hslToRgb({ h: 0, s: 0, l: 100 })
    expect(rgb.r).toBe(255)
    expect(rgb.g).toBe(255)
    expect(rgb.b).toBe(255)
  })

  it("converts black", () => {
    const rgb = hslToRgb({ h: 0, s: 0, l: 0 })
    expect(rgb.r).toBe(0)
    expect(rgb.g).toBe(0)
    expect(rgb.b).toBe(0)
  })
})

describe("round-trip rgb → hsl → rgb (within rounding error)", () => {
  const cases = [
    { r: 255, g: 0, b: 0 },
    { r: 0, g: 255, b: 0 },
    { r: 0, g: 0, b: 255 },
    { r: 255, g: 255, b: 255 },
    { r: 0, g: 0, b: 0 },
  ]
  for (const rgb of cases) {
    it(`rgb(${rgb.r},${rgb.g},${rgb.b}) round-trips`, () => {
      const hsl = rgbToHsl(rgb)
      const result = hslToRgb(hsl)
      expect(result.r).toBeCloseTo(rgb.r, -0.5)
      expect(result.g).toBeCloseTo(rgb.g, -0.5)
      expect(result.b).toBeCloseTo(rgb.b, -0.5)
    })
  }
})

describe("rgbToOkLch", () => {
  it("returns oklch string for valid input", () => {
    const result = rgbToOkLch({ r: 255, g: 0, b: 0 })
    expect(result).toMatch(/^oklch\(/)
  })

  it("handles black", () => {
    const result = rgbToOkLch({ r: 0, g: 0, b: 0 })
    expect(result).toMatch(/^oklch\(/)
  })

  it("handles white", () => {
    const result = rgbToOkLch({ r: 255, g: 255, b: 255 })
    expect(result).toMatch(/^oklch\(/)
  })
})

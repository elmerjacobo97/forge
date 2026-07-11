import { describe, it, expect } from "vitest"
import { transform } from "./transform"

describe("transform", () => {
  it("upper", () => {
    expect(transform("upper", "hello")).toBe("HELLO")
  })

  it("lower", () => {
    expect(transform("lower", "HELLO")).toBe("hello")
  })

  it("title", () => {
    expect(transform("title", "hello world")).toBe("Hello World")
  })

  it("camel", () => {
    expect(transform("camel", "hello world")).toBe("helloWorld")
    expect(transform("camel", "hello_world")).toBe("helloWorld")
    expect(transform("camel", "HelloWorld")).toBe("helloWorld")
  })

  it("pascal", () => {
    expect(transform("pascal", "hello world")).toBe("HelloWorld")
  })

  it("snake", () => {
    expect(transform("snake", "helloWorld")).toBe("hello_world")
  })

  it("kebab", () => {
    expect(transform("kebab", "helloWorld")).toBe("hello-world")
  })

  it("trim", () => {
    expect(transform("trim", "  hello  \n  world  \n")).toBe("hello\nworld")
  })

  it("sort-asc", () => {
    expect(transform("sort-asc", "c\na\nb")).toBe("a\nb\nc")
  })

  it("sort-desc", () => {
    expect(transform("sort-desc", "a\nb\nc")).toBe("c\nb\na")
  })

  it("unique", () => {
    expect(transform("unique", "a\na\nb\na")).toBe("a\nb")
  })

  it("reverse-lines", () => {
    expect(transform("reverse-lines", "a\nb\nc")).toBe("c\nb\na")
  })

  it("returns empty for empty input", () => {
    expect(transform("upper", "")).toBe("")
    expect(transform("camel", "")).toBe("")
  })
})

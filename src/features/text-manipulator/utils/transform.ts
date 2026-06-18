export type Op =
  | "upper"
  | "lower"
  | "title"
  | "camel"
  | "pascal"
  | "snake"
  | "kebab"
  | "trim"
  | "sort-asc"
  | "sort-desc"
  | "unique"
  | "reverse-lines"

function splitWords(str: string): string[] {
  return str
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_\-]+/g, " ")
    .split(/\s+/)
    .filter(Boolean)
}

export function transform(op: Op, input: string): string {
  if (!input) return ""
  switch (op) {
    case "upper":
      return input.toUpperCase()
    case "lower":
      return input.toLowerCase()
    case "title":
      return input.replace(
        /\w\S*/g,
        (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
      )
    case "camel": {
      const words = splitWords(input)
      return words
        .map((w, i) =>
          i === 0
            ? w.toLowerCase()
            : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
        )
        .join("")
    }
    case "pascal": {
      const words = splitWords(input)
      return words
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join("")
    }
    case "snake":
      return splitWords(input)
        .map((w) => w.toLowerCase())
        .join("_")
    case "kebab":
      return splitWords(input)
        .map((w) => w.toLowerCase())
        .join("-")
    case "trim":
      return input
        .split("\n")
        .map((l) => l.trim())
        .join("\n")
        .replace(/^\n+|\n+$/g, "")
    case "sort-asc":
      return input.split("\n").sort((a, b) => a.localeCompare(b)).join("\n")
    case "sort-desc":
      return input.split("\n").sort((a, b) => b.localeCompare(a)).join("\n")
    case "unique": {
      const seen = new Set<string>()
      return input
        .split("\n")
        .filter((l) => {
          if (seen.has(l)) return false
          seen.add(l)
          return true
        })
        .join("\n")
    }
    case "reverse-lines":
      return input.split("\n").reverse().join("\n")
  }
}

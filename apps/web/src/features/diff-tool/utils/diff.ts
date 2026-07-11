import { diffLines } from "diff"

export type DiffType = "equal" | "added" | "removed"

export interface DiffLine {
  type: DiffType
  value: string
  oldNumber: number | null
  newNumber: number | null
}

export interface DiffOptions {
  ignoreWhitespace?: boolean
}

export function computeLineDiff(
  original: string,
  modified: string,
  options: DiffOptions = {}
): DiffLine[] {
  if (!original && !modified) return []

  const changes = diffLines(original, modified, {
    newlineIsToken: true,
    ignoreWhitespace: options.ignoreWhitespace,
  })

  const lines: DiffLine[] = []
  let oldNumber = 1
  let newNumber = 1

  for (const change of changes) {
    const type: DiffType = change.added ? "added" : change.removed ? "removed" : "equal"
    const parts = change.value.split("\n")
    // diffLines with newlineIsToken emits trailing empty segment after final newline
    const lastIsEmpty = parts[parts.length - 1] === ""
    const count = lastIsEmpty ? parts.length - 1 : parts.length

    for (let i = 0; i < count; i++) {
      const value = parts[i]
      if (type === "added") {
        lines.push({ type, value, oldNumber: null, newNumber: newNumber++ })
      } else if (type === "removed") {
        lines.push({ type, value, oldNumber: oldNumber++, newNumber: null })
      } else {
        lines.push({ type, value, oldNumber: oldNumber++, newNumber: newNumber++ })
      }
    }
  }

  return lines
}

export function formatDiff(lines: DiffLine[]): string {
  return lines
    .map((line) => {
      const marker = line.type === "added" ? "+" : line.type === "removed" ? "-" : " "
      return `${marker}${line.value}`
    })
    .join("\n")
}

export function diffStats(lines: DiffLine[]): { added: number; removed: number; equal: number } {
  return lines.reduce(
    (acc, line) => {
      if (line.type === "added") acc.added++
      else if (line.type === "removed") acc.removed++
      else acc.equal++
      return acc
    },
    { added: 0, removed: 0, equal: 0 }
  )
}

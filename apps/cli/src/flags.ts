import { createInterface } from "node:readline/promises"
import { stdin as input, stdout as output } from "node:process"

export function getFlagValue(args: string[], name: string): string | undefined {
  const index = args.indexOf(name)
  if (index === -1) return undefined
  const value = args[index + 1]
  if (!value || value.startsWith("--")) return undefined
  return value
}

export function hasFlag(args: string[], name: string): boolean {
  return args.includes(name)
}

/** Flags that do not take a following value (must not steal positionals). */
export const BOOLEAN_FLAGS = new Set(["--json", "--help", "-h"])

export function getPositionals(args: string[]): string[] {
  const positionals: string[] = []
  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (arg.startsWith("-")) {
      if (!BOOLEAN_FLAGS.has(arg)) {
        const next = args[i + 1]
        if (next && !next.startsWith("-")) i += 1
      }
      continue
    }
    positionals.push(arg)
  }
  return positionals
}

/** Parse `--tags a,b,c` into a trimmed string array. */
export function parseTagsFlag(raw: string | undefined): string[] {
  if (raw == null || raw.trim() === "") return []
  return raw
    .split(",")
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0)
}

export async function promptText(question: string): Promise<string> {
  const rl = createInterface({ input, output })
  try {
    const answer = await rl.question(question)
    return answer.trim()
  } finally {
    rl.close()
  }
}

/** Prompt for a secret without echoing characters (TTY only). */
export async function promptSecret(question: string): Promise<string> {
  if (!input.isTTY || !output.isTTY) {
    return promptText(question)
  }

  output.write(question)

  return new Promise((resolve, reject) => {
    const wasRaw = input.isRaw
    input.setRawMode(true)
    input.resume()

    let value = ""

    const cleanup = () => {
      input.off("data", onData)
      input.setRawMode(wasRaw ?? false)
      input.pause()
    }

    const onData = (chunk: Buffer) => {
      const char = chunk.toString("utf8")

      if (char === "\n" || char === "\r" || char === "\u0004") {
        cleanup()
        output.write("\n")
        resolve(value)
        return
      }

      if (char === "\u0003") {
        cleanup()
        output.write("\n")
        reject(new Error("Cancelled."))
        return
      }

      if (char === "\u007f" || char === "\b") {
        value = value.slice(0, -1)
        return
      }

      value += char
    }

    input.on("data", onData)
  })
}

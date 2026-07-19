import { createInterface } from "node:readline/promises"
import { stdin as input, stdout as output } from "node:process"

export function getFlagValue(args: string[], name: string): string | undefined {
  const index = args.indexOf(name)
  if (index === -1) return undefined
  const value = args[index + 1]
  if (!value || value.startsWith("--")) return undefined
  return value
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

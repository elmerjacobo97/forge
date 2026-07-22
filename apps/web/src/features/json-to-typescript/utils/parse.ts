export interface ParseResult {
  samples: unknown[]
  error: string | null
}

export function sanitizeJson(input: string): string {
  let inString = false
  let escape = false
  let result = ""

  for (let i = 0; i < input.length; i++) {
    const char = input[i]

    if (escape) {
      result += char
      escape = false
      continue
    }

    if (char === "\\") {
      result += char
      escape = true
      continue
    }

    if (char === '"') {
      inString = !inString
      result += char
      continue
    }

    if (inString) {
      result += char
      continue
    }

    // Single-line comment
    if (char === "/" && input[i + 1] === "/") {
      while (i < input.length && input[i] !== "\n") i++
      continue
    }

    // Multi-line comment
    if (char === "/" && input[i + 1] === "*") {
      i += 2
      while (i < input.length && !(input[i] === "*" && input[i + 1] === "/")) i++
      i++
      continue
    }

    result += char
  }

  // Remove trailing commas before } or ]
  result = result.replace(/,(\s*[}\]])/g, "$1")

  return result
}

export function parseSamples(input: string): ParseResult {
  if (!input.trim()) return { samples: [], error: null }

  try {
    const cleaned = sanitizeJson(input)
    const parsed = JSON.parse(cleaned)

    if (Array.isArray(parsed)) {
      return { samples: parsed, error: null }
    }

    return { samples: [parsed], error: null }
  } catch (e) {
    return { samples: [], error: (e as Error).message }
  }
}

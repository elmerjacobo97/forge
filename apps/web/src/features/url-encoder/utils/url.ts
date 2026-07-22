export function encodeUrl(input: string): string {
  try {
    return encodeURIComponent(input)
  } catch {
    return ""
  }
}

export function decodeUrl(input: string): { output: string; error: string | null } {
  try {
    return { output: decodeURIComponent(input), error: null }
  } catch {
    return { output: "", error: "Invalid percent-encoding" }
  }
}

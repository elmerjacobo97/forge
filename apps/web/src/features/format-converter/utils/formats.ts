import { jsonAdapter } from "@/features/format-converter/utils/json"
import { tomlAdapter } from "@/features/format-converter/utils/toml"
import { yamlAdapter } from "@/features/format-converter/utils/yaml"

export type FormatId = "json" | "yaml" | "toml"

export interface FormatAdapter {
  id: FormatId
  name: string
  parse(input: string): unknown
  stringify(data: unknown): string
}

export const adapters: Record<FormatId, FormatAdapter> = {
  json: jsonAdapter,
  yaml: yamlAdapter,
  toml: tomlAdapter,
}

export const formatIds: FormatId[] = ["json", "yaml", "toml"]

export interface ConvertResult {
  output: string
  error: string | null
}

export function convert(input: string, from: FormatId, to: FormatId): ConvertResult {
  if (!input.trim()) return { output: "", error: null }
  if (from === to) return { output: input, error: null }

  try {
    const parsed = adapters[from].parse(input)
    const output = adapters[to].stringify(parsed)
    return { output, error: null }
  } catch (e) {
    return { output: "", error: (e as Error).message }
  }
}

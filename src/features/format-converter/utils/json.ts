import type { FormatAdapter } from "@/features/format-converter/utils/formats"

export const jsonAdapter: FormatAdapter = {
  id: "json",
  name: "JSON",
  parse(input) {
    return JSON.parse(input)
  },
  stringify(data) {
    return JSON.stringify(data, null, 2)
  },
}

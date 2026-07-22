import * as toml from "smol-toml"

import type { FormatAdapter } from "@/features/format-converter/utils/formats"

export const tomlAdapter: FormatAdapter = {
  id: "toml",
  name: "TOML",
  parse(input) {
    return toml.parse(input)
  },
  stringify(data) {
    return toml.stringify(data)
  },
}

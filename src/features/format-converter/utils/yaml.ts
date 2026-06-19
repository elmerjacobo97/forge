import * as yaml from "js-yaml"

import type { FormatAdapter } from "@/features/format-converter/utils/formats"

export const yamlAdapter: FormatAdapter = {
  id: "yaml",
  name: "YAML",
  parse(input) {
    return yaml.load(input)
  },
  stringify(data) {
    return yaml.dump(data, { indent: 2, lineWidth: -1 })
  },
}

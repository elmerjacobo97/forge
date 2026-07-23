import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

import { getCliVersion } from "./version.js"

describe("getCliVersion", () => {
  it("reads the current package version", () => {
    const packageJson: unknown = JSON.parse(
      readFileSync(new URL("../package.json", import.meta.url), "utf8"),
    )

    expect(packageJson).toMatchObject({ version: getCliVersion() })
  })
})

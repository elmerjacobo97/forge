import { readFileSync } from "node:fs"

export function getCliVersion(): string {
  const packageJson: unknown = JSON.parse(
    readFileSync(new URL("../package.json", import.meta.url), "utf8"),
  )

  if (typeof packageJson !== "object" || packageJson === null) {
    throw new Error("CLI package metadata is invalid.")
  }

  const version = (packageJson as Record<string, unknown>).version
  if (typeof version !== "string" || version.length === 0) {
    throw new Error("CLI package version is missing.")
  }

  return version
}

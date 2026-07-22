#!/usr/bin/env node
/**
 * Fails unless the release tag matches `version` in apps/cli/package.json.
 *
 * Usage:
 *   node ./scripts/check-release-tag.mjs v0.1.0
 *   GITHUB_REF_NAME=v0.1.0 node ./scripts/check-release-tag.mjs
 */
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const packageDir = join(dirname(fileURLToPath(import.meta.url)), "..")
const pkgPath = join(packageDir, "package.json")

/** @type {unknown} */
const pkg = JSON.parse(readFileSync(pkgPath, "utf8"))

/**
 * @param {unknown} value
 * @returns {value is Record<string, unknown>}
 */
function isRecord(value) {
  return typeof value === "object" && value !== null
}

if (!isRecord(pkg) || typeof pkg.version !== "string" || pkg.version.length === 0) {
  process.stderr.write(
    `check-release-tag: missing or invalid "version" in ${pkgPath}\n`,
  )
  process.exit(1)
}

const version = pkg.version
const expectedTag = `v${version}`

/** @type {string | undefined} */
let tagFromArgv
for (const arg of process.argv.slice(2)) {
  if (arg === "--") continue
  tagFromArgv = arg
  break
}

const tag = tagFromArgv ?? process.env.GITHUB_REF_NAME ?? process.env.RELEASE_TAG

if (typeof tag !== "string" || tag.length === 0) {
  process.stderr.write(
    "check-release-tag: pass a tag (vX.Y.Z) as argv[2], or set GITHUB_REF_NAME / RELEASE_TAG\n",
  )
  process.exit(1)
}

if (tag !== expectedTag) {
  process.stderr.write(
    `check-release-tag: tag "${tag}" does not match package version "${expectedTag}" (version=${version} in ${pkgPath})\n`,
  )
  process.exit(1)
}

process.stdout.write(
  `check-release-tag: OK (${tag} matches version ${version})\n`,
)

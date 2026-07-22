#!/usr/bin/env node

import { existsSync } from "node:fs"
import { dirname, join } from "node:path"
import { pathToFileURL } from "node:url"
import { fileURLToPath } from "node:url"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const entry = join(root, "dist", "main.js")

if (!existsSync(entry)) {
  process.stderr.write(
    "forge-cli: dist/main.js missing. Run: pnpm --filter ./apps/cli build\n",
  )
  process.exit(1)
}

await import(pathToFileURL(entry).href)

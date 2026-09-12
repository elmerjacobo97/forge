import { rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const coreEntry = fileURLToPath(
  new URL("../../../packages/forge-core/src/index.ts", import.meta.url),
);

await rm("dist", { recursive: true, force: true });

await build({
  entryPoints: ["src/main.ts"],
  outfile: "dist/main.js",
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node20",
  packages: "external",
  alias: {
    "@forge/core": coreEntry,
  },
  logLevel: "info",
});

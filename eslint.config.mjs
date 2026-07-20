import { defineConfig, globalIgnores } from "eslint/config";
import js from "@eslint/js";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig([
  globalIgnores([
    "**/node_modules/**",
    "**/.next/**",
    "**/dist/**",
    "**/out/**",
    "**/build/**",
    "**/.pnpm-store/**",
    "**/.tanstack/**",
    "**/coverage/**",
    "apps/web/next-env.d.ts",
    "pnpm-lock.yaml",
  ]),

  // Next.js app (@forge/web)
  {
    files: ["apps/web/**/*.{js,jsx,mjs,cjs,ts,tsx}"],
    extends: [...nextVitals, ...nextTs],
    settings: {
      next: {
        rootDir: "apps/web",
      },
    },
  },

  // CLI (@forge/cli) — Node/TypeScript, no React
  {
    files: ["apps/cli/**/*.{js,mjs,cjs,ts}"],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },

  // Workspace root config files
  {
    files: ["*.{js,mjs,cjs}", "eslint.config.mjs"],
    extends: [js.configs.recommended],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },

  // Disable formatting rules that conflict with Prettier (must be last)
  prettier,
]);

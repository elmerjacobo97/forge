import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./src/test/setup.ts"],
    env: {
      NEXT_PUBLIC_INSFORGE_URL: "http://localhost:7130",
      NEXT_PUBLIC_INSFORGE_ANON_KEY: "test-anon-key",
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/components/ui/**", "src/test/**", "src/**/*.test.ts", "src/**/*.test.tsx"],
    },
  },
});

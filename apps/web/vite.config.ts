/// <reference types="vitest" />
import path from "path";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { tanstackRouter } from "@tanstack/router-plugin/vite";

export default defineConfig({
  plugins: [
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
    }),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;
          if (id.includes("appwrite")) return "vendor-appwrite";
          if (id.includes("lucide-react")) return "vendor-lucide";
          if (id.includes("react/") || id.includes("react-dom/") || id.includes("@tanstack/")) {
            return "vendor-core";
          }
          return undefined;
        },
      },
    },
  },
  test: {
    globals: true,
    environment: "node",
  },
});

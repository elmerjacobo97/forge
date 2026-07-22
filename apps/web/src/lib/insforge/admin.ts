import "server-only";

import { createAdminClient } from "@insforge/sdk";

/**
 * Privileged InsForge client for trusted server code (Route Handlers).
 * Uses INSFORGE_API_KEY — never import this module from client components.
 */
export function createInsForgeAdminClient() {
  const apiKey = process.env.INSFORGE_API_KEY;
  if (!apiKey) {
    throw new Error("INSFORGE_API_KEY is not configured");
  }

  const baseUrl = process.env.NEXT_PUBLIC_INSFORGE_URL;
  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_INSFORGE_URL is not configured");
  }

  return createAdminClient({
    baseUrl,
    apiKey,
  });
}

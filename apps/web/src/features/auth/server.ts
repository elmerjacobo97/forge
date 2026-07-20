import "server-only";

import type { AuthUser } from "@/features/auth/types";
import { createInsForgeServerClient } from "@/lib/insforge/server";

function profileName(profile: unknown): string {
  if (typeof profile !== "object" || profile === null || !("name" in profile)) return "Developer";
  return typeof profile.name === "string" && profile.name ? profile.name : "Developer";
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const insforge = await createInsForgeServerClient();
  const { data, error } = await insforge.auth.getCurrentUser();
  if (error || !data.user) return null;

  return {
    id: data.user.id,
    email: data.user.email,
    name: profileName(data.user.profile),
  };
}

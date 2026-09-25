"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createAuthActions } from "@insforge/sdk/ssr";

import { loginSchema } from "@/features/auth/schemas/auth-schema";
import { safeRedirectPath } from "@/features/auth/oauth";

export type AuthActionResult = { ok: true } | { ok: false; message: string };

const oauthCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 600,
};

export async function signInWithGitHubAction(redirectTo?: string): Promise<AuthActionResult> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) return { ok: false, message: "GitHub sign-in is not configured." };

  let callbackUrl: string;
  try {
    callbackUrl = new URL("/api/auth/callback", appUrl).toString();
  } catch {
    return { ok: false, message: "GitHub sign-in is not configured." };
  }

  const cookieStore = await cookies();
  const auth = createAuthActions({ cookies: cookieStore });
  let result;
  try {
    result = await auth.signInWithOAuth("github", {
      redirectTo: callbackUrl,
      skipBrowserRedirect: true,
    });
  } catch {
    return { ok: false, message: "Unable to start GitHub sign-in. Please try again." };
  }

  const { data, error } = result;
  if (error || !data.url || !data.codeVerifier) {
    return { ok: false, message: "Unable to start GitHub sign-in. Please try again." };
  }

  cookieStore.set("insforge_code_verifier", data.codeVerifier, oauthCookieOptions);
  cookieStore.set("forge_oauth_redirect", safeRedirectPath(redirectTo), oauthCookieOptions);

  redirect(data.url);
}

export async function signInAction(input: unknown, redirectTo?: string): Promise<AuthActionResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Enter a valid email and password." };

  const auth = createAuthActions({ cookies: await cookies() });
  const { error } = await auth.signInWithPassword(parsed.data);
  if (error) return { ok: false, message: error.message };

  redirect(safeRedirectPath(redirectTo));
}

export async function signOutAction(): Promise<void> {
  const auth = createAuthActions({ cookies: await cookies() });
  await auth.signOut();
  redirect("/login");
}

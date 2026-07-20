"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createAuthActions, createServerClient } from "@insforge/sdk/ssr";

import {
  loginSchema,
  registerSchema,
  verifyEmailSchema,
} from "@/features/auth/schemas/auth-schema";

export type AuthActionResult = { ok: true } | { ok: false; message: string };

function safeRedirectPath(value: string | undefined): string {
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/dev-board";
}

export async function signInAction(
  input: unknown,
  redirectTo?: string,
): Promise<AuthActionResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Enter a valid email and password." };

  const auth = createAuthActions({ cookies: await cookies() });
  const { error } = await auth.signInWithPassword(parsed.data);
  if (error) return { ok: false, message: error.message };

  redirect(safeRedirectPath(redirectTo));
}

export async function registerAction(input: unknown): Promise<AuthActionResult> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Check the registration fields." };

  const auth = createAuthActions({ cookies: await cookies() });
  const { name, email, password } = parsed.data;
  const { error } = await auth.signUp({ email, password, name });
  if (error) return { ok: false, message: error.message };

  redirect(`/verify-email?email=${encodeURIComponent(email)}`);
}

export async function verifyEmailAction(input: unknown): Promise<AuthActionResult> {
  const parsed = verifyEmailSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Enter the 6-digit verification code." };

  const auth = createAuthActions({ cookies: await cookies() });
  const { error } = await auth.verifyEmail(parsed.data);
  if (error) return { ok: false, message: error.message };

  redirect("/dev-board");
}

export async function resendVerificationAction(email: unknown): Promise<AuthActionResult> {
  const parsed = verifyEmailSchema.shape.email.safeParse(email);
  if (!parsed.success) return { ok: false, message: "Enter a valid email." };

  const insforge = createServerClient({ cookies: await cookies() });
  const { error } = await insforge.auth.resendVerificationEmail({ email: parsed.data });
  if (error) return { ok: false, message: error.message };

  return { ok: true };
}

export async function signOutAction(): Promise<void> {
  const auth = createAuthActions({ cookies: await cookies() });
  await auth.signOut();
  redirect("/login");
}

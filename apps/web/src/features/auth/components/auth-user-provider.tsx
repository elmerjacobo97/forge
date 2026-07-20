"use client";

import { createContext, use } from "react";

import type { AuthUser } from "@/features/auth/types";

const AuthUserContext = createContext<AuthUser | null>(null);

export function AuthUserProvider({
  children,
  user,
}: {
  children: React.ReactNode;
  user: AuthUser;
}) {
  return <AuthUserContext value={user}>{children}</AuthUserContext>;
}

export function useAuthUser(): AuthUser {
  const user = use(AuthUserContext);
  if (!user) throw new Error("useAuthUser must be used inside AuthUserProvider");
  return user;
}

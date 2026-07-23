import { Suspense } from "react";
import type { Metadata } from "next";

import { LoginForm } from "@/features/auth/components/login-form";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to access your Forge developer workspace.",
};

async function LoginContent({ searchParams }: PageProps<"/login">) {
  const { redirect } = await searchParams;
  return <LoginForm redirectTo={typeof redirect === "string" ? redirect : undefined} />;
}

export default function LoginPage(props: PageProps<"/login">) {
  return (
    <Suspense fallback={<div className="h-96 w-full max-w-sm animate-pulse rounded-xl bg-muted" />}>
      <LoginContent {...props} />
    </Suspense>
  );
}

import { Suspense } from "react";

import { LoginForm } from "@/features/auth/components/login-form";

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

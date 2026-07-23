import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { VerifyEmailForm } from "@/features/auth/components/verify-email-form";

export const metadata: Metadata = {
  title: "Verify email",
  description: "Verify your email address to finish creating your Forge account.",
};

async function VerifyEmailContent({ searchParams }: PageProps<"/verify-email">) {
  const { email } = await searchParams;
  if (typeof email !== "string" || email.length === 0) redirect("/register");

  return <VerifyEmailForm email={email} />;
}

export default function VerifyEmailPage(props: PageProps<"/verify-email">) {
  return (
    <Suspense fallback={<div className="h-96 w-full max-w-sm animate-pulse rounded-xl bg-muted" />}>
      <VerifyEmailContent {...props} />
    </Suspense>
  );
}

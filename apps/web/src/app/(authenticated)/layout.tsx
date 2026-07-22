import { Suspense } from "react";
import { redirect } from "next/navigation";

import { AuthenticatedShell } from "@/components/layout/authenticated-shell";
import { getCurrentUser } from "@/features/auth/server";

async function AuthenticatedContent({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return <AuthenticatedShell user={user}>{children}</AuthenticatedShell>;
}

export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-background" />}>
      <AuthenticatedContent>{children}</AuthenticatedContent>
    </Suspense>
  );
}

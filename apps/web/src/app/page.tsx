import { Suspense } from "react";
import type { Metadata } from "next";

import { getCurrentUser } from "@/features/auth/server";
import { LandingPage } from "@/features/landing/components/landing-page";

export const metadata: Metadata = {
  title: "Forge — A focused dev toolkit",
  description:
    "Everything a developer needs, in one tab. Utilities, Dev Board, bookmarks, and snippets in a fast web workspace.",
};

async function HomeContent() {
  const user = await getCurrentUser();
  return <LandingPage isAuthenticated={user !== null} />;
}

function LandingFallback() {
  return <div className="min-h-screen bg-background" aria-hidden />;
}

export default function HomePage() {
  return (
    <Suspense fallback={<LandingFallback />}>
      <HomeContent />
    </Suspense>
  );
}

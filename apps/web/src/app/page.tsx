import { Suspense } from "react";
import type { Metadata } from "next";

import { getCurrentUser } from "@/features/auth/server";
import { LandingPage } from "@/features/landing/components/landing-page";
import { siteDescription, siteName, siteTitle, siteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: siteTitle },
  description: siteDescription,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName,
    title: siteTitle,
    description: siteDescription,
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Forge developer workspace for planning, debugging, and shipping",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
    images: ["/opengraph-image"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${siteUrl.href}#website`,
      url: siteUrl.href,
      name: siteName,
      description: siteDescription,
      inLanguage: "en",
    },
    {
      "@type": "WebApplication",
      "@id": `${siteUrl.href}#application`,
      url: siteUrl.href,
      name: siteName,
      description: siteDescription,
      applicationCategory: "DeveloperApplication",
      operatingSystem: "Any",
      browserRequirements: "Requires a modern web browser",
      featureList: [
        "Browser-native developer utilities",
        "Kanban board with automatic time tracking",
        "Bookmark and reusable resource management",
        "Webhook inspection",
        "Uptime monitoring",
        "Synced project, ticket, bookmark, and resource workflows from the CLI",
      ],
    },
  ],
};

async function HomeContent() {
  const user = await getCurrentUser();
  return <LandingPage isAuthenticated={user !== null} />;
}

function LandingFallback() {
  return (
    <div
      className="min-h-dvh bg-background"
      aria-hidden
    />
  );
}

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
        }}
      />
      <Suspense fallback={<LandingFallback />}>
        <HomeContent />
      </Suspense>
    </>
  );
}

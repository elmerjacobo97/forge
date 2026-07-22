import { LandingCta } from "@/features/landing/components/landing-cta";
import { LandingFooter } from "@/features/landing/components/landing-footer";
import { LandingHero } from "@/features/landing/components/landing-hero";
import { LandingNav } from "@/features/landing/components/landing-nav";
import { LandingPillars } from "@/features/landing/components/landing-pillars";
import { LandingTools } from "@/features/landing/components/landing-tools";

interface LandingPageProps {
  isAuthenticated: boolean;
}

export function LandingPage({ isAuthenticated }: LandingPageProps) {
  return (
    <div className="flex min-h-dvh flex-col">
      <LandingNav isAuthenticated={isAuthenticated} />
      <main className="flex-1">
        <LandingHero isAuthenticated={isAuthenticated} />
        <LandingPillars />
        <LandingTools isAuthenticated={isAuthenticated} />
        <LandingCta isAuthenticated={isAuthenticated} />
      </main>
      <LandingFooter isAuthenticated={isAuthenticated} />
    </div>
  );
}

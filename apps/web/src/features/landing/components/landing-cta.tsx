import Link from "next/link";
import { ArrowRight, Hammer, LayoutDashboard } from "lucide-react";

import { Button } from "@/components/ui/button";

interface LandingCtaProps {
  isAuthenticated: boolean;
}

export function LandingCta({ isAuthenticated }: LandingCtaProps) {
  return (
    <section className="border-t border-border/60">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
        <div className="landing-metal-panel relative overflow-hidden rounded-3xl px-6 py-14 sm:px-10 sm:py-16 lg:px-14">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_120%_at_100%_0%,color-mix(in_oklch,var(--primary)_20%,transparent),transparent_55%)]"
          />
          <Hammer
            aria-hidden
            className="pointer-events-none absolute -right-6 -bottom-8 size-48 text-primary/[0.06] sm:size-56"
          />

          <div className="relative grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div>
              {isAuthenticated ? (
                <>
                  <p className="landing-section-label">Welcome back</p>
                  <h2 className="mt-3 font-heading text-[clamp(1.75rem,4vw,2.5rem)] font-semibold leading-tight tracking-tight">
                    Your workspace is ready.
                  </h2>
                  <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
                    Jump back into Dev Board, bookmarks, snippets, and your full toolkit.
                  </p>
                  <div className="mt-8">
                    <Button size="lg" className="h-10 px-5 shadow-md shadow-primary/15" asChild>
                      <Link href="/dev-board">
                        <LayoutDashboard data-icon="inline-start" />
                        Go to dashboard
                        <ArrowRight data-icon="inline-end" />
                      </Link>
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <p className="landing-section-label">Get started</p>
                  <h2 className="mt-3 font-heading text-[clamp(1.75rem,4vw,2.5rem)] font-semibold leading-tight tracking-tight">
                    Open the tab you will keep coming back to.
                  </h2>
                  <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
                    Create a free account to save bookmarks, track tickets, and keep your dev
                    toolkit ready every morning.
                  </p>
                  <div className="mt-8 flex flex-wrap items-center gap-3">
                    <Button size="lg" className="h-10 px-5 shadow-md shadow-primary/15" asChild>
                      <Link href="/register">
                        Get started free
                        <ArrowRight data-icon="inline-end" />
                      </Link>
                    </Button>
                    <Button variant="outline" size="lg" className="h-10 px-5" asChild>
                      <Link href="/login">I already have an account</Link>
                    </Button>
                  </div>
                </>
              )}
            </div>

            <div
              aria-hidden
              className="hidden rounded-xl border border-border/50 bg-background/50 p-5 font-mono text-[11px] leading-relaxed text-muted-foreground lg:block"
            >
              <p className="text-primary"># forge.toml</p>
              <p className="mt-3">[workspace]</p>
              <p>tools = 22</p>
              <p>install = false</p>
              <p>theme = &quot;copper-steel&quot;</p>
              <p className="mt-3 text-foreground/80">
                <span className="text-primary">→</span> ready when you are
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

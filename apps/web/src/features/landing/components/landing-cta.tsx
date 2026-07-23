import Link from "next/link";
import { ArrowRight, Hammer, LayoutDashboard } from "lucide-react";

import { Button } from "@/components/ui/button";
import { tools } from "@/lib/tools";

interface LandingCtaProps {
  isAuthenticated: boolean;
}

export function LandingCta({ isAuthenticated }: LandingCtaProps) {
  return (
    <section className="border-t border-border/60">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28">
        <div className="landing-metal-panel relative overflow-hidden rounded-3xl px-6 py-14 sm:px-10 sm:py-16 lg:px-14">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_120%_at_100%_0%,color-mix(in_oklch,var(--primary)_22%,transparent),transparent_55%)]"
          />
          <Hammer
            aria-hidden
            className="pointer-events-none absolute -right-6 -bottom-8 size-48 text-primary/[0.06] sm:size-64"
          />

          <div className="relative grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <p className="landing-section-label">
                {isAuthenticated ? "Workspace ready" : "Start with the next task"}
              </p>
              <h2 className="mt-3 max-w-2xl font-heading text-[clamp(2rem,5vw,3.5rem)] font-semibold leading-[1.02] tracking-tight text-balance">
                Put your development workflow back in one place.
              </h2>
              <p className="mt-5 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                From tracked tickets to captured requests and reusable snippets, Forge keeps the
                work around your code connected and ready.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Button
                  size="lg"
                  className="h-11 px-5 shadow-md shadow-primary/15"
                  asChild
                >
                  <Link href={isAuthenticated ? "/dev-board" : "/register"}>
                    {isAuthenticated ? <LayoutDashboard data-icon="inline-start" /> : null}
                    {isAuthenticated ? "Open workspace" : "Create your workspace"}
                    <ArrowRight data-icon="inline-end" />
                  </Link>
                </Button>
                {!isAuthenticated ? (
                  <Button
                    variant="outline"
                    size="lg"
                    className="h-11 px-5"
                    asChild
                  >
                    <Link href="/login">I already have an account</Link>
                  </Button>
                ) : null}
              </div>
            </div>

            <div
              aria-hidden
              className="rounded-xl border border-border/50 bg-background/55 p-5 font-mono text-[11px] leading-relaxed text-muted-foreground sm:p-6"
            >
              <p className="text-primary">forge.workspace</p>
              <p className="mt-4">tools = {tools.length}</p>
              <p>web = connected</p>
              <p>cli = synced</p>
              <p>setup = minimal</p>
              <p className="mt-4 text-foreground/80">
                <span className="text-primary">→</span> ready for the next task
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

import Link from "next/link";
import { ArrowRight, Columns3, LayoutDashboard, NotebookText, Webhook } from "lucide-react";

import { Button } from "@/components/ui/button";
import { tools } from "@/lib/tools";

const ctaSignals = [
  { icon: Columns3, title: "Plan", description: "Tickets, timers, and analytics" },
  { icon: Webhook, title: "Inspect", description: "Requests, webhooks, and payloads" },
  { icon: NotebookText, title: "Keep", description: "Bookmarks, resources, and CLI" },
] as const;

interface LandingCtaProps {
  isAuthenticated: boolean;
}

export function LandingCta({ isAuthenticated }: LandingCtaProps) {
  return (
    <section className="border-t border-border/60">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28">
        <div className="landing-metal-panel relative overflow-hidden rounded-3xl px-6 py-12 sm:px-10 sm:py-14 lg:px-14">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 right-0 w-2/5 bg-primary/5"
          />

          <div className="relative grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-16">
            <div>
              <h2 className="landing-display max-w-2xl font-heading text-[clamp(2rem,5vw,3.5rem)] font-semibold leading-[1.02] tracking-tight text-balance">
                Put your development workflow back in one place.
              </h2>
              <p className="mt-5 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                From tracked tickets to captured requests and reusable snippets, Forge keeps the
                work around your code connected and ready. {tools.length} browser tools stay close
                to the surfaces that give them context.
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

            <div className="border-t border-border/60 pt-5 lg:border-t-0 lg:border-l lg:pl-8 lg:pt-0">
              <p className="font-mono text-[10px] tracking-[0.16em] text-primary uppercase">
                One account, fewer handoffs
              </p>
              <div className="mt-5 divide-y divide-border/60 border-y border-border/60">
                {ctaSignals.map((signal) => (
                  <div
                    key={signal.title}
                    className="flex items-center gap-4 py-4"
                  >
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <signal.icon className="size-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="font-heading text-sm font-semibold">{signal.title}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{signal.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

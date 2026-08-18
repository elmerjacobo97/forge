import Link from "next/link";
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  LayoutDashboard,
  SquareTerminal,
  Webhook,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { tools } from "@/lib/tools";

const heroSignals = [
  { value: tools.length.toString(), label: "browser tools" },
  { value: "Web + CLI", label: "one workspace" },
  { value: "Local-first", label: "for core utilities" },
] as const;

const workflowSteps = ["Plan", "Inspect", "Ship", "Remember"] as const;

interface LandingHeroProps {
  isAuthenticated: boolean;
}

export function LandingHero({ isAuthenticated }: LandingHeroProps) {
  return (
    <section className="relative overflow-hidden border-b border-border/60">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 hidden w-[42%] border-l border-border/45 bg-muted/20 lg:block"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-0 right-0 h-px w-1/3 bg-primary/70"
      />

      <div className="relative z-10 mx-auto grid max-w-7xl gap-14 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-16 lg:py-28">
        <div className="flex flex-col gap-8 lg:pr-8">
          <div className="landing-fade-up space-y-6">
            <h1 className="landing-display max-w-2xl font-heading text-[clamp(3.25rem,8vw,6rem)] font-bold leading-[0.88] tracking-[-0.045em] text-balance">
              Ship work,
              <span className="block text-primary">not context switches.</span>
            </h1>
            <p className="max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Plan development with automatic time tracking, inspect requests, monitor endpoints,
              transform data, and keep reusable knowledge close. One workspace, from first ticket to
              production check.
            </p>
          </div>

          <div className="landing-fade-up landing-delay-1 flex flex-wrap items-center gap-3">
            {isAuthenticated ? (
              <Button
                size="lg"
                className="h-11 px-5"
                asChild
              >
                <Link href="/dev-board">
                  <LayoutDashboard data-icon="inline-start" />
                  Open workspace
                  <ArrowRight data-icon="inline-end" />
                </Link>
              </Button>
            ) : (
              <>
                <Button
                  size="lg"
                  className="h-11 px-5 shadow-md shadow-primary/15"
                  asChild
                >
                  <Link href="/register">
                    Create your workspace
                    <ArrowRight data-icon="inline-end" />
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="h-11 px-5"
                  asChild
                >
                  <Link href="/login">Sign in</Link>
                </Button>
              </>
            )}
          </div>

          <dl className="landing-fade-up landing-delay-2 grid max-w-lg grid-cols-3 gap-4 border-t border-border/60 pt-5">
            {heroSignals.map((signal) => (
              <div
                key={signal.label}
                className="flex flex-col gap-1"
              >
                <dt className="order-2 text-[10px] leading-tight tracking-[0.12em] text-muted-foreground uppercase sm:text-[11px]">
                  {signal.label}
                </dt>
                <dd className="font-mono text-sm font-semibold tracking-tight text-primary sm:text-base">
                  {signal.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="landing-fade-up landing-delay-3 relative lg:translate-x-4">
          <div
            aria-hidden
            className="absolute -inset-8 rounded-[2.5rem] bg-linear-to-br from-primary/15 via-transparent to-primary/5 blur-3xl"
          />

          <div
            aria-hidden
            className="landing-metal-panel relative overflow-hidden rounded-2xl"
          >
            <div className="flex items-start justify-between gap-4 border-b border-border/50 px-4 py-4 sm:px-5">
              <div>
                <p className="font-heading text-sm font-semibold">Today at a glance</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Work stays connected across surfaces.
                </p>
              </div>
              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-primary/25 bg-primary/8 px-2 py-1 font-mono text-[9px] tracking-[0.12em] text-primary uppercase">
                <span className="landing-ember-pulse size-1.5 rounded-full bg-primary" />
                live
              </span>
            </div>

            <div className="border-b border-border/50 p-4 sm:px-5">
              <ol className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {workflowSteps.map((step, index) => (
                  <li
                    key={step}
                    className="flex items-center gap-2 rounded-lg border border-border/50 bg-background/35 px-2 py-2 font-mono text-[9px] tracking-wide text-muted-foreground uppercase sm:text-[10px]"
                  >
                    <span
                      className={`flex size-5 shrink-0 items-center justify-center rounded-md border ${
                        index < 2
                          ? "border-primary/35 bg-primary/10 text-primary"
                          : "border-border/70 bg-background/50"
                      }`}
                    >
                      {index + 1}
                    </span>
                    <span className="hidden sm:inline">{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="grid sm:grid-cols-[0.94fr_1.06fr]">
              <div className="border-b border-border/50 p-4 sm:border-r sm:border-b-0 sm:p-5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-medium tracking-[0.15em] text-muted-foreground uppercase">
                    In progress
                  </span>
                  <span className="rounded-full border border-primary/25 bg-primary/8 px-2 py-0.5 font-mono text-[9px] text-primary">
                    HIGH
                  </span>
                </div>
                <div className="mt-3 rounded-xl border border-primary/30 bg-background/65 p-4 shadow-[inset_3px_0_0_color-mix(in_oklch,var(--primary)_65%,transparent)]">
                  <p className="font-heading text-sm font-semibold">Investigate webhook retries</p>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    Reproduce failed delivery, inspect payload, document fix.
                  </p>
                  <div className="mt-5 flex items-center justify-between border-t border-border/50 pt-3">
                    <span className="flex items-center gap-1.5 font-mono text-[10px] text-primary">
                      <span className="landing-ember-pulse size-1.5 rounded-full bg-primary" />
                      00:42:18
                    </span>
                    <span className="font-mono text-[9px] text-muted-foreground">auto-tracked</span>
                  </div>
                </div>
              </div>

              <div className="bg-background/35 p-4 sm:p-5">
                <div className="flex items-center gap-2 text-[10px] font-medium tracking-[0.15em] text-muted-foreground uppercase">
                  <SquareTerminal className="size-3.5 text-primary" />
                  Synced terminal
                </div>
                <div className="mt-3 rounded-xl border border-border/50 bg-background/75 p-3.5 font-mono text-[10px] leading-relaxed">
                  <p className="text-muted-foreground">
                    <span className="text-primary">$</span> forge-cli ticket list --project-id
                    prj_42
                  </p>
                  <p className="mt-2 text-foreground/85">IN_PROGRESS webhook retries</p>
                  <p className="text-muted-foreground">REVIEW auth refresh tests</p>
                  <p className="mt-3 flex items-center gap-1.5 text-primary">
                    <CheckCircle2 className="size-3" /> 2 tickets returned
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 divide-x divide-border/50 border-t border-border/50">
              <div className="flex items-center gap-3 px-4 py-3 sm:px-5">
                <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Webhook className="size-4" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[11px] font-medium">Webhook captured</p>
                  <p className="font-mono text-[9px] text-muted-foreground">POST /hooks · 200</p>
                </div>
              </div>
              <div className="flex items-center gap-3 px-4 py-3 sm:px-5">
                <span className="flex size-8 items-center justify-center rounded-lg bg-chart-3/10 text-chart-3">
                  <Activity className="size-4" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[11px] font-medium">API operational</p>
                  <p className="font-mono text-[9px] text-muted-foreground">184 ms · checked now</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

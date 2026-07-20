import Link from "next/link";
import { ArrowRight, Hammer, LayoutDashboard } from "lucide-react";

import { Button } from "@/components/ui/button";
import { tools } from "@/lib/tools";

const heroColumns = [
  { name: "Backlog", count: 4, cards: ["Auth refactor", "API schema"], active: false },
  { name: "In progress", count: 2, cards: ["Landing page", "JWT tests"], active: true },
  { name: "Done", count: 6, cards: ["JSON formatter", "Base64 tool"], active: false },
] as const;

const heroStats = [
  { value: `${tools.length}+`, label: "dev tools" },
  { value: "0", label: "installs" },
  { value: "1", label: "tab" },
] as const;

interface LandingHeroProps {
  isAuthenticated: boolean;
}

export function LandingHero({ isAuthenticated }: LandingHeroProps) {
  return (
    <section className="landing-grain relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 left-1/2 h-[520px] w-[min(900px,120vw)] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,color-mix(in_oklch,var(--primary)_22%,transparent),transparent_68%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-24 -right-16 h-64 w-64 rounded-full bg-[radial-gradient(circle,color-mix(in_oklch,var(--primary)_10%,transparent),transparent_70%)] [animation:landing-ember-pulse_5s_ease-in-out_infinite]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.22] [background-image:repeating-linear-gradient(-12deg,color-mix(in_oklch,var(--foreground)_5%,transparent)_0px,color-mix(in_oklch,var(--foreground)_5%,transparent)_1px,transparent_1px,transparent_9px)]"
      />

      <div className="relative z-10 mx-auto grid max-w-6xl gap-14 px-4 py-20 sm:px-6 sm:py-28 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:gap-12 xl:gap-20">
        <div className="flex flex-col gap-7">
          <div className="landing-fade-up">
            <span className="landing-eyebrow">
              <span className="size-1.5 rounded-full bg-primary [animation:landing-ember-pulse_2s_ease-in-out_infinite]" />
              Web-native dev workshop
            </span>
          </div>

          <div className="landing-fade-up landing-delay-1 space-y-4">
            <p className="font-heading text-[clamp(3.5rem,9vw,5.5rem)] font-bold leading-[0.92] tracking-tight">
              Forge
            </p>
            <h1 className="max-w-xl font-heading text-[clamp(1.75rem,4vw,2.65rem)] font-semibold leading-[1.12] tracking-tight text-balance">
              Everything a developer needs, in{" "}
              <span className="landing-copper-text">one tab.</span>
            </h1>
          </div>

          <p className="landing-fade-up landing-delay-2 max-w-md text-base leading-relaxed text-muted-foreground sm:text-[1.05rem]">
            A focused web workspace with utilities, kanban time tracking, bookmarks, and snippets —
            quenched steel surfaces, copper accents, zero context switching.
          </p>

          <div className="landing-fade-up landing-delay-3 flex flex-wrap items-center gap-3">
            {isAuthenticated ? (
              <Button size="lg" className="h-10 px-5" asChild>
                <Link href="/dev-board">
                  <LayoutDashboard data-icon="inline-start" />
                  Go to dashboard
                  <ArrowRight data-icon="inline-end" />
                </Link>
              </Button>
            ) : (
              <>
                <Button size="lg" className="h-10 px-5 shadow-md shadow-primary/15" asChild>
                  <Link href="/register">
                    Get started
                    <ArrowRight data-icon="inline-end" />
                  </Link>
                </Button>
                <Button variant="outline" size="lg" className="h-10 px-5" asChild>
                  <Link href="/login">Sign in</Link>
                </Button>
              </>
            )}
          </div>

          <dl className="landing-fade-up landing-delay-4 grid max-w-sm grid-cols-3 gap-3 border-t border-border/60 pt-6">
            {heroStats.map((stat) => (
              <div key={stat.label}>
                <dt className="sr-only">{stat.label}</dt>
                <dd className="font-mono text-2xl font-semibold tracking-tight text-primary">
                  {stat.value}
                </dd>
                <dd className="mt-0.5 text-[11px] tracking-wide text-muted-foreground uppercase">
                  {stat.label}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="landing-fade-up landing-delay-5 relative lg:translate-x-2">
          <div
            aria-hidden
            className="absolute -inset-6 rounded-[2rem] bg-linear-to-br from-primary/15 via-transparent to-primary/5 blur-3xl"
          />

          <div className="landing-float landing-metal-panel relative overflow-hidden rounded-2xl">
            <div className="flex items-center gap-2 border-b border-border/50 px-4 py-3">
              <span className="size-2.5 rounded-full bg-primary/70" />
              <span className="size-2.5 rounded-full bg-muted-foreground/25" />
              <span className="size-2.5 rounded-full bg-muted-foreground/25" />
              <span className="ml-2 font-mono text-[11px] text-muted-foreground">
                forge / dev-board
              </span>
              <Hammer className="ml-auto size-3.5 text-primary/50" />
            </div>

            <div className="grid gap-3 p-4 sm:grid-cols-3">
              {heroColumns.map((column) => (
                <div
                  key={column.name}
                  className={`rounded-lg border p-3 ${
                    column.active
                      ? "border-primary/35 bg-primary/8 shadow-[inset_0_1px_0_color-mix(in_oklch,var(--primary)_20%,transparent)]"
                      : "border-border/50 bg-background/40"
                  }`}
                >
                  <div className="mb-2.5 flex items-center justify-between">
                    <span className="text-[10px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
                      {column.name}
                    </span>
                    <span className="font-mono text-[10px] text-muted-foreground">{column.count}</span>
                  </div>
                  <div className="space-y-2">
                    {column.cards.map((card) => (
                      <div
                        key={card}
                        className="rounded-md border border-border/40 bg-background/70 px-2.5 py-2 backdrop-blur-sm"
                      >
                        <p className="truncate text-xs font-medium">{card}</p>
                        {column.active && card === "Landing page" ? (
                          <p className="mt-1 font-mono text-[10px] text-primary">02:14:33</p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-border/50 px-4 py-2.5">
              <p className="font-mono text-[10px] text-muted-foreground">
                <span className="text-primary">$</span> forge-cli ticket list --project-id forge
              </p>
            </div>
          </div>

          <div
            aria-hidden
            className="absolute -bottom-5 -left-3 hidden w-44 rounded-lg border border-border/60 bg-card/95 p-3 shadow-xl backdrop-blur-md sm:block lg:-left-8"
          >
            <p className="font-mono text-[9px] tracking-wide text-primary uppercase">jwt-decoder</p>
            <pre className="mt-2 font-mono text-[9px] leading-relaxed text-muted-foreground">
              {`{\n  "sub": "dev",\n  "exp": 1710000000\n}`}
            </pre>
          </div>
        </div>
      </div>
    </section>
  );
}

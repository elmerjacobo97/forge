import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Hammer, LayoutDashboard, SearchX } from "lucide-react";

import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Page not found",
  description: "The requested Forge page could not be found.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function NotFound() {
  return (
    <main className="landing-grain relative flex min-h-dvh items-center overflow-hidden bg-background px-4 py-16 sm:px-6">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-48 left-1/2 size-[36rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,color-mix(in_oklch,var(--primary)_20%,transparent),transparent_68%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-25 [background-image:repeating-linear-gradient(-12deg,color-mix(in_oklch,var(--foreground)_5%,transparent)_0px,color-mix(in_oklch,var(--foreground)_5%,transparent)_1px,transparent_1px,transparent_10px)]"
      />

      <div className="relative z-10 mx-auto grid w-full max-w-5xl items-center gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
        <div className="relative mx-auto flex aspect-square w-full max-w-sm items-center justify-center">
          <div
            aria-hidden
            className="absolute inset-8 rotate-3 rounded-[2rem] border border-primary/25 bg-primary/8"
          />
          <div className="landing-metal-panel relative flex size-56 -rotate-3 flex-col items-center justify-center rounded-3xl sm:size-64">
            <span className="font-mono text-[5.5rem] font-semibold leading-none tracking-[-0.12em] text-primary sm:text-[6.5rem]">
              404
            </span>
            <span className="mt-3 flex items-center gap-2 font-mono text-[10px] tracking-[0.18em] text-muted-foreground uppercase">
              <SearchX
                className="size-3.5"
                aria-hidden="true"
              />
              route not found
            </span>
          </div>
          <div
            aria-hidden
            className="absolute right-1 bottom-8 flex size-14 rotate-6 items-center justify-center rounded-xl border border-border/60 bg-card text-primary shadow-xl sm:right-5"
          >
            <Hammer className="size-6" />
          </div>
        </div>

        <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
          <span className="landing-eyebrow">
            <span className="size-1.5 rounded-full bg-primary" />
            Broken link in the chain
          </span>
          <h1 className="mt-6 max-w-xl font-heading text-4xl font-semibold leading-tight tracking-tight text-balance sm:text-5xl">
            This page never made it out of the workshop.
          </h1>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">
            The URL may be outdated, mistyped, or moved. Return to Forge and keep building with the
            tools that are ready to ship.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start">
            <Button
              size="lg"
              className="h-10 px-5"
              asChild
            >
              <Link href="/">
                <ArrowLeft data-icon="inline-start" />
                Return home
              </Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="h-10 px-5"
              asChild
            >
              <Link href="/dev-board">
                <LayoutDashboard data-icon="inline-start" />
                Open workspace
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}

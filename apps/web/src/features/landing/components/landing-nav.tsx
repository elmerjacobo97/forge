import Link from "next/link";
import { Hammer, LayoutDashboard } from "lucide-react";

import { ThemeToggleButton } from "@/components/theme-toggle-button";
import { Button, buttonVariants } from "@/components/ui/button";
import { LandingScrollButton } from "@/features/landing/components/landing-scroll-button";

interface LandingNavProps {
  isAuthenticated: boolean;
}

export function LandingNav({ isAuthenticated }: LandingNavProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/75 backdrop-blur-xl supports-[backdrop-filter]:bg-background/65">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="group flex items-center gap-2.5"
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-primary to-primary/70 text-primary-foreground shadow-sm ring-1 ring-primary/25 transition-shadow group-hover:shadow-[0_0_20px_-4px_color-mix(in_oklch,var(--primary)_50%,transparent)]">
            <Hammer className="size-4" />
          </span>
          <span className="flex min-w-0 flex-col leading-none">
            <span className="font-heading text-sm font-semibold tracking-tight">Forge</span>
            <span className="text-[9px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
              developer workspace
            </span>
          </span>
        </Link>

        <nav
          aria-label="Landing navigation"
          className="flex items-center gap-1.5 sm:gap-2"
        >
          <div className="mr-2 hidden items-center gap-1 lg:flex">
            <LandingScrollButton
              targetId="workflow"
              className={buttonVariants({ variant: "ghost", size: "sm" })}
            >
              Workflow
            </LandingScrollButton>
            <LandingScrollButton
              targetId="toolkit"
              className={buttonVariants({ variant: "ghost", size: "sm" })}
            >
              Toolkit
            </LandingScrollButton>
          </div>
          <ThemeToggleButton />
          {isAuthenticated ? (
            <Button
              size="sm"
              asChild
            >
              <Link href="/dev-board">
                <LayoutDashboard data-icon="inline-start" />
                <span className="hidden sm:inline">Open workspace</span>
                <span className="sm:hidden">Open</span>
              </Link>
            </Button>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="hidden sm:inline-flex"
                asChild
              >
                <Link href="/login">Sign in</Link>
              </Button>
              <Button
                size="sm"
                asChild
              >
                <Link href="/register">Create workspace</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

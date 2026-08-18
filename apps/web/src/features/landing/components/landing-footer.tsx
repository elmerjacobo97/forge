import Link from "next/link";
import { Hammer } from "lucide-react";

import { LandingScrollButton } from "@/features/landing/components/landing-scroll-button";
import { tools } from "@/lib/tools";

interface LandingFooterProps {
  isAuthenticated: boolean;
}

export function LandingFooter({ isAuthenticated }: LandingFooterProps) {
  return (
    <footer className="border-t border-border/60 bg-muted/15">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-4 py-10 sm:flex-row sm:px-6">
        <div className="flex flex-col items-center gap-2 text-center sm:items-start sm:text-left">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Hammer className="size-3.5 text-primary" />
            <span className="font-heading text-sm font-semibold text-foreground">Forge</span>
          </div>
          <p className="max-w-md text-xs leading-relaxed text-muted-foreground">
            Developer workspace for planning, debugging, monitoring, and reusable knowledge.
          </p>
          <p className="font-mono text-[10px] tracking-wide text-muted-foreground/80">
            {tools.length} web tools · core workflows on CLI
          </p>
        </div>
        <nav
          aria-label="Landing footer"
          className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm sm:justify-end"
        >
          <LandingScrollButton
            targetId="workflow"
            className="text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
          >
            Workflow
          </LandingScrollButton>
          <LandingScrollButton
            targetId="toolkit"
            className="text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
          >
            Toolkit
          </LandingScrollButton>
          {isAuthenticated ? (
            <Link
              href="/dev-board"
              className="text-primary underline-offset-4 transition-colors hover:text-primary/80 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
            >
              Open workspace
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="text-primary underline-offset-4 transition-colors hover:text-primary/80 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
              >
                Create workspace
              </Link>
            </>
          )}
        </nav>
      </div>
    </footer>
  );
}

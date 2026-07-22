import Link from "next/link";
import { Hammer } from "lucide-react";

import { tools } from "@/lib/tools";

interface LandingFooterProps {
  isAuthenticated: boolean;
}

export function LandingFooter({ isAuthenticated }: LandingFooterProps) {
  return (
    <footer className="border-t border-border/60 bg-muted/15">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-5 px-4 py-10 sm:flex-row sm:px-6">
        <div className="flex flex-col items-center gap-2 text-center sm:items-start sm:text-left">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Hammer className="size-3.5 text-primary" />
            <span className="font-heading text-sm font-semibold text-foreground">Forge</span>
          </div>
          <p className="max-w-xs text-xs leading-relaxed text-muted-foreground">
            A focused toolkit for software development workflows.
          </p>
          <p className="font-mono text-[10px] tracking-wide text-muted-foreground/80">
            {tools.length} tools · browser-native · no install
          </p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          {isAuthenticated ? (
            <Link
              href="/dev-board"
              className="text-primary underline-offset-4 transition-colors hover:text-primary/80 hover:underline"
            >
              Go to dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="text-primary underline-offset-4 transition-colors hover:text-primary/80 hover:underline"
              >
                Get started
              </Link>
            </>
          )}
        </div>
      </div>
    </footer>
  );
}

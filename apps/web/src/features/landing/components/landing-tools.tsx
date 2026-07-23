import Link from "next/link";
import { ArrowRight, SquareTerminal } from "lucide-react";

import { tools } from "@/lib/tools";

const workspaceIds = new Set(["dev-board", "bookmarks", "resources"]);
const spotlightIds = new Set([
  ...workspaceIds,
  "http-tester",
  "webhook-inspector",
  "uptime-monitor",
]);
const utilityIds = new Set([
  "json-formatter",
  "jwt-decoder",
  "regex-tester",
  "base64",
  "hash-generator",
  "uuid-generator",
  "diff-tool",
  "format-converter",
  "json-to-typescript",
  "mock-data-generator",
  "qr-generator",
  "image-tools",
]);

const spotlightTools = tools.filter((tool) => spotlightIds.has(tool.id));
const utilityTools = tools.filter((tool) => utilityIds.has(tool.id));
const remainingCount = tools.length - spotlightTools.length - utilityTools.length;
const categoryCount = new Set(tools.map((tool) => tool.category)).size;

export function LandingTools({ isAuthenticated }: { isAuthenticated: boolean }) {
  return (
    <section
      id="toolkit"
      className="scroll-mt-20 border-t border-border/60"
    >
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28">
        <div className="mb-14 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="landing-section-label">The workspace</p>
            <h2 className="mt-3 font-heading text-[clamp(2rem,5vw,3.5rem)] font-semibold leading-[1.02] tracking-tight text-balance">
              Serious workflows up front. Fast utilities one command away.
            </h2>
          </div>
          <p className="font-mono text-sm text-muted-foreground">
            <span className="text-primary">{tools.length}</span> tools · {categoryCount} categories
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {spotlightTools.map((tool) => {
            const isWorkspaceTool = workspaceIds.has(tool.id);

            return (
              <article
                key={tool.id}
                className={`landing-tool-card relative overflow-hidden rounded-2xl border p-6 ${
                  isWorkspaceTool
                    ? "landing-metal-panel border-primary/20"
                    : "border-border/60 bg-card/45"
                }`}
              >
                {isWorkspaceTool ? (
                  <div
                    aria-hidden
                    className="pointer-events-none absolute -top-12 -right-12 size-36 rounded-full bg-primary/10 blur-2xl"
                  />
                ) : null}
                <div className="relative">
                  <div className="mb-5 flex items-center justify-between gap-3">
                    <span className="flex size-10 items-center justify-center rounded-xl bg-primary/12 text-primary ring-1 ring-primary/15">
                      <tool.icon className="size-5" />
                    </span>
                    <span className="font-mono text-[9px] tracking-[0.16em] text-muted-foreground uppercase">
                      {isWorkspaceTool ? "Synced workspace" : tool.category}
                    </span>
                  </div>
                  <h3 className="font-heading text-xl font-semibold tracking-tight">{tool.name}</h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
                    {tool.description}
                  </p>
                </div>
              </article>
            );
          })}
        </div>

        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {utilityTools.map((tool) => (
            <article
              key={tool.id}
              className="landing-tool-card group flex min-h-24 items-start gap-3 rounded-xl border border-border/50 bg-card/35 px-4 py-3.5 transition-colors hover:border-primary/25 hover:bg-card/75"
            >
              <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted/80 text-muted-foreground transition-colors group-hover:bg-primary/15 group-hover:text-primary">
                <tool.icon className="size-4" />
              </span>
              <div className="min-w-0">
                <p className="truncate font-mono text-xs font-medium">{tool.name}</p>
                <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-muted-foreground">
                  {tool.description}
                </p>
              </div>
            </article>
          ))}
        </div>

        <div className="landing-metal-panel mt-6 grid overflow-hidden rounded-2xl lg:grid-cols-[0.8fr_1.2fr]">
          <div className="border-b border-border/50 p-6 lg:border-r lg:border-b-0 lg:p-8">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <SquareTerminal className="size-5" />
              </span>
              <div>
                <p className="font-heading text-lg font-semibold">Same work, from your terminal.</p>
                <p className="text-xs text-muted-foreground">Dev Board, bookmarks, and resources</p>
              </div>
            </div>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-muted-foreground">
              Forge CLI keeps core workflows available where development already happens, backed by
              the same account and data as the web workspace.
            </p>
          </div>

          <div className="bg-background/45 p-6 font-mono text-[11px] leading-relaxed sm:p-8">
            <p className="text-muted-foreground">
              <span className="text-primary">$</span> forge-cli project list
            </p>
            <p className="mt-1 text-foreground/80">Forge Web · API Reliability</p>
            <p className="mt-4 text-muted-foreground">
              <span className="text-primary">$</span> forge-cli bookmark list --json
            </p>
            <p className="mt-1 text-foreground/80">
              [{`{ "title": "InsForge SDK", "category": "docs" }`}]
            </p>
          </div>
        </div>

        <div className="mt-9 flex flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground sm:flex-row">
          <span>
            {remainingCount > 0
              ? `${remainingCount} more focused tools are ready inside Forge.`
              : "Your full toolkit is ready inside Forge."}
          </span>
          <Link
            href={isAuthenticated ? "/dev-board" : "/register"}
            className="inline-flex items-center gap-1 text-primary underline-offset-4 hover:underline"
          >
            {isAuthenticated ? "Open workspace" : "Create your workspace"}
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}

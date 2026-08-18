import Link from "next/link";
import { ArrowRight, ArrowUpRight, SquareTerminal } from "lucide-react";

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
  "password-generator",
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
            <h2 className="landing-display font-heading text-[clamp(2rem,5vw,3.5rem)] font-semibold leading-[1.02] tracking-tight text-balance">
              Everything you reach for, in one place.
            </h2>
            <p className="mt-5 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              Serious workflows up front. Fast utilities when the task needs a quick answer.
            </p>
          </div>
          <dl className="grid grid-cols-2 gap-x-8 gap-y-1 border-t border-border/60 pt-3 font-mono text-xs text-muted-foreground lg:min-w-56 lg:border-t-0 lg:border-l lg:pl-6 lg:pt-0">
            <div>
              <dt className="tracking-[0.14em] uppercase">Tools</dt>
              <dd className="mt-1 text-base text-primary">{tools.length}</dd>
            </div>
            <div>
              <dt className="tracking-[0.14em] uppercase">Categories</dt>
              <dd className="mt-1 text-base text-primary">{categoryCount}</dd>
            </div>
          </dl>
        </div>

        <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-14">
          <div className="landing-metal-panel overflow-hidden rounded-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-border/50 px-4 py-5 sm:px-5">
              <div>
                <h3 className="font-heading text-lg font-semibold">Core surfaces</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Connected tools for the work that needs context.
                </p>
              </div>
              <span className="shrink-0 font-mono text-[10px] tracking-[0.12em] text-primary uppercase">
                {spotlightTools.length} linked
              </span>
            </div>
            <div className="divide-y divide-border/50">
              {spotlightTools.map((tool) => {
                const isWorkspaceTool = workspaceIds.has(tool.id);

                return (
                  <Link
                    key={tool.id}
                    href={tool.path}
                    className="group flex min-w-0 items-center gap-4 px-4 py-4 transition-colors hover:bg-background/60 focus-visible:relative focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring sm:px-5"
                  >
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary ring-1 ring-primary/15 transition-colors group-hover:bg-primary/18">
                      <tool.icon className="size-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span className="font-heading text-base font-semibold tracking-tight">
                          {tool.name}
                        </span>
                        <span className="font-mono text-[9px] tracking-[0.14em] text-muted-foreground uppercase">
                          {isWorkspaceTool ? "workspace" : tool.category}
                        </span>
                      </span>
                      <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                        {tool.description}
                      </span>
                    </span>
                    <ArrowUpRight className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col">
            <div className="mb-5">
              <h3 className="font-heading text-lg font-semibold">Small tools, instant results.</h3>
              <p className="mt-1 max-w-sm text-xs leading-relaxed text-muted-foreground">
                Format, compare, encode, generate, and validate without leaving the browser.
              </p>
            </div>
            <div className="divide-y divide-border/60 border-y border-border/60">
              {utilityTools.map((tool) => (
                <Link
                  key={tool.id}
                  href={tool.path}
                  className="group flex min-w-0 items-center gap-3 py-3 transition-colors hover:bg-muted/35 focus-visible:relative focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted/80 text-muted-foreground transition-colors group-hover:bg-primary/15 group-hover:text-primary">
                    <tool.icon className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-mono text-xs font-medium">
                      {tool.name}
                    </span>
                    <span className="mt-0.5 block truncate text-[10px] tracking-[0.08em] text-muted-foreground uppercase">
                      {tool.category}
                    </span>
                  </span>
                  <ArrowUpRight className="size-3.5 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="landing-metal-panel mt-10 grid overflow-hidden rounded-2xl lg:grid-cols-[0.8fr_1.2fr]">
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
            className="inline-flex items-center gap-1 text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
          >
            {isAuthenticated ? "Open workspace" : "Create your workspace"}
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}

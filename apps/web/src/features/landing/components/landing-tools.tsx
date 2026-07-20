import Link from "next/link";

import { tools } from "@/lib/tools";

const featuredIds = new Set(["dev-board", "bookmarks", "snippets"]);
const utilityIds = new Set([
  "json-formatter",
  "http-tester",
  "jwt-decoder",
  "regex-tester",
  "base64",
  "hash-generator",
  "uuid-generator",
  "diff-tool",
  "format-converter",
  "qr-generator",
]);

const featuredTools = tools.filter((tool) => featuredIds.has(tool.id));
const utilityTools = tools.filter((tool) => utilityIds.has(tool.id));
const remainingCount = tools.length - featuredTools.length - utilityTools.length;

export function LandingTools({ isAuthenticated }: { isAuthenticated: boolean }) {
  const [devBoard, ...otherFeatured] = featuredTools;

  return (
    <section className="border-t border-border/60">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
        <div className="mb-14 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl">
            <p className="landing-section-label">Toolkit</p>
            <h2 className="mt-3 font-heading text-[clamp(1.75rem,4vw,2.5rem)] font-semibold leading-tight tracking-tight">
              Productivity features and dev utilities, unified.
            </h2>
          </div>
          <p className="font-mono text-sm text-muted-foreground">
            <span className="text-primary">{tools.length}</span> tools · 12 categories
          </p>
        </div>

        <div className="mb-6 grid gap-4 lg:grid-cols-2">
          {devBoard ? (
            <div className="landing-tool-card landing-metal-panel relative overflow-hidden rounded-2xl p-7 lg:row-span-2">
              <div
                aria-hidden
                className="pointer-events-none absolute -top-12 -right-12 size-40 rounded-full bg-primary/10 blur-2xl"
              />
              <div className="relative">
                <div className="mb-4 flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-primary/15 text-primary ring-1 ring-primary/20">
                    <devBoard.icon className="size-5" />
                  </span>
                  <span className="landing-eyebrow border-primary/20 bg-primary/5 py-0.5">
                    {devBoard.category}
                  </span>
                </div>
                <h3 className="font-heading text-2xl font-semibold tracking-tight">{devBoard.name}</h3>
                <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
                  {devBoard.description}
                </p>
                <div className="mt-8 grid grid-cols-3 gap-2 font-mono text-[10px] text-muted-foreground">
                  <div className="rounded-md border border-border/50 bg-background/50 px-2 py-2">
                    <span className="block text-primary">todo</span>4
                  </div>
                  <div className="rounded-md border border-primary/30 bg-primary/5 px-2 py-2">
                    <span className="block text-primary">active</span>2
                  </div>
                  <div className="rounded-md border border-border/50 bg-background/50 px-2 py-2">
                    <span className="block text-primary">done</span>6
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            {otherFeatured.map((tool) => (
              <div
                key={tool.id}
                className="landing-tool-card rounded-2xl border border-primary/20 bg-linear-to-br from-primary/8 to-transparent p-6"
              >
                <div className="mb-3 flex items-center gap-2.5">
                  <span className="flex size-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
                    <tool.icon className="size-4" />
                  </span>
                  <span className="text-[10px] font-medium tracking-[0.16em] text-primary uppercase">
                    {tool.category}
                  </span>
                </div>
                <h3 className="font-heading text-lg font-semibold">{tool.name}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {tool.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {utilityTools.map((tool, index) => (
            <div
              key={tool.id}
              className="landing-tool-card group flex items-start gap-3 rounded-xl border border-border/50 bg-card/40 px-3.5 py-3 transition-colors hover:border-primary/25 hover:bg-card/80"
              style={{ animationDelay: `${index * 40}ms` }}
            >
              <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-muted/80 text-muted-foreground transition-colors group-hover:bg-primary/15 group-hover:text-primary">
                <tool.icon className="size-3.5" />
              </span>
              <div className="min-w-0">
                <p className="truncate font-mono text-xs font-medium">{tool.name}</p>
                <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-muted-foreground">
                  {tool.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-10 text-center text-sm text-muted-foreground">
          {isAuthenticated ? (
            <>
              Plus {remainingCount} more tools in your{" "}
              <Link href="/dev-board" className="text-primary underline-offset-4 hover:underline">
                dashboard
              </Link>
              .
            </>
          ) : (
            <>
              Plus {remainingCount} more tools after you{" "}
              <Link href="/register" className="text-primary underline-offset-4 hover:underline">
                create an account
              </Link>
              .
            </>
          )}
        </p>
      </div>
    </section>
  );
}

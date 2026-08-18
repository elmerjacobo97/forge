import { Activity, Columns3, NotebookText, Webhook } from "lucide-react";

const workflows = [
  {
    index: "01",
    icon: Columns3,
    title: "Plan the work",
    description:
      "Move tickets through a focused Kanban board while Forge tracks active time and project flow automatically.",
    detail: "Dev Board · timers · analytics",
  },
  {
    index: "02",
    icon: Webhook,
    title: "Inspect the system",
    description:
      "Send HTTP requests without browser CORS limits, capture webhooks, decode JWTs, and test patterns in place.",
    detail: "HTTP · webhooks · JWT · regex",
  },
  {
    index: "03",
    icon: Activity,
    title: "Watch production",
    description:
      "Schedule endpoint checks, review response history, and receive Telegram alerts when availability changes.",
    detail: "Uptime · history · alerts",
  },
  {
    index: "04",
    icon: NotebookText,
    title: "Keep what works",
    description:
      "Save documentation, prompts, snippets, and configs so useful context survives beyond the current task.",
    detail: "Bookmarks · resources · CLI",
  },
] as const;

export function LandingPillars() {
  return (
    <section
      id="workflow"
      className="relative scroll-mt-20 border-t border-border/60"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-linear-to-b from-muted/30 via-muted/10 to-transparent"
      />
      <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28">
        <div className="mb-14 grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
          <div>
            <h2 className="landing-display max-w-xl font-heading text-[clamp(2rem,5vw,3.5rem)] font-semibold leading-[1.02] tracking-tight text-balance">
              Built around the work between idea and release.
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-relaxed text-muted-foreground lg:justify-self-end lg:text-base">
            Forge is not another folder of disconnected mini tools. Planning, debugging, monitoring,
            and reusable knowledge live in the same account and stay within reach.
          </p>
        </div>

        <div className="grid gap-12 lg:grid-cols-[0.7fr_1.3fr] lg:gap-20">
          <div className="flex flex-col gap-7 lg:pt-5">
            <div className="border-l border-primary pl-4">
              <p className="font-mono text-xs tracking-[0.16em] text-primary uppercase">
                From idea to release
              </p>
              <p className="mt-3 max-w-sm font-heading text-2xl font-semibold leading-tight tracking-tight">
                Keep each handoff visible.
              </p>
            </div>
            <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
              Every surface is close to the next one. Move from a ticket to a request, from a
              response to a note, or from an incident to a monitor without rebuilding your context.
            </p>
          </div>

          <div className="relative">
            <div
              aria-hidden
              className="absolute top-7 bottom-7 left-[1.35rem] hidden w-px bg-border sm:block"
            />
            <div className="flex flex-col">
              {workflows.map((workflow) => (
                <article
                  key={workflow.title}
                  className="group relative grid gap-4 border-t border-border/60 py-6 transition-colors first:border-t-0 hover:bg-muted/25 sm:grid-cols-[3rem_minmax(0,1fr)_auto] sm:items-start sm:gap-5 sm:px-4"
                >
                  <div className="relative flex size-11 items-center justify-center rounded-xl border border-border/70 bg-background text-primary transition-[border-color,background-color,box-shadow] duration-300 group-hover:border-primary/35 group-hover:bg-primary/10 group-hover:shadow-[0_0_24px_-4px_color-mix(in_oklch,var(--primary)_35%,transparent)]">
                    <workflow.icon className="size-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <h3 className="font-heading text-lg font-semibold tracking-tight">
                        {workflow.title}
                      </h3>
                      <span className="shrink-0 font-mono text-xs tabular-nums text-primary/55">
                        {workflow.index}
                      </span>
                    </div>
                    <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
                      {workflow.description}
                    </p>
                  </div>
                  <p className="font-mono text-[10px] tracking-wide text-primary/80 uppercase sm:pt-1 sm:text-right">
                    {workflow.detail}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

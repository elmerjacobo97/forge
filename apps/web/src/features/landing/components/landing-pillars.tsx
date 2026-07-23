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
            <p className="landing-section-label">One connected flow</p>
            <h2 className="mt-3 max-w-xl font-heading text-[clamp(2rem,5vw,3.5rem)] font-semibold leading-[1.02] tracking-tight text-balance">
              Built around the work between idea and release.
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-relaxed text-muted-foreground lg:justify-self-end lg:text-base">
            Forge is not another folder of disconnected mini tools. Planning, debugging, monitoring,
            and reusable knowledge live in the same account and stay within reach.
          </p>
        </div>

        <div className="grid overflow-hidden rounded-2xl border border-border/60 bg-border/40 sm:grid-cols-2 lg:grid-cols-4">
          {workflows.map((workflow) => (
            <article
              key={workflow.title}
              className="group relative -mt-px -ml-px min-h-72 border-t border-l border-border/60 bg-background/80 p-7 transition-colors hover:bg-background sm:p-8"
            >
              <span className="landing-pillar-index absolute top-6 right-6">{workflow.index}</span>
              <div className="mb-8 flex size-11 items-center justify-center rounded-xl border border-border/60 bg-muted/40 text-primary transition-[border-color,background-color,box-shadow] duration-300 group-hover:border-primary/35 group-hover:bg-primary/10 group-hover:shadow-[0_0_24px_-4px_color-mix(in_oklch,var(--primary)_35%,transparent)]">
                <workflow.icon className="size-5" />
              </div>
              <h3 className="font-heading text-lg font-semibold tracking-tight">
                {workflow.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {workflow.description}
              </p>
              <p className="mt-6 font-mono text-[10px] tracking-wide text-primary/80 uppercase">
                {workflow.detail}
              </p>
              <div
                aria-hidden
                className="absolute bottom-0 left-8 h-px w-[calc(100%-4rem)] bg-primary/60 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
              />
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

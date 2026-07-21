import { Bookmark, Columns3, Shield } from "lucide-react";

const pillars = [
  {
    index: "01",
    icon: Columns3,
    title: "One tab, not twenty",
    description:
      "Stop bouncing between ad-heavy sites and one-off scripts. Forge keeps JSON, JWT, regex, hashes, and more in a single consistent interface.",
  },
  {
    index: "02",
    icon: Shield,
    title: "Privacy-minded by default",
    description:
      "Utility work stays in your browser where it can. Sensitive transforms run client-side so you are not pasting secrets into random third-party pages.",
  },
  {
    index: "03",
    icon: Bookmark,
    title: "A workspace that remembers",
    description:
      "Sign in to persist Dev Board tickets, bookmarks, resources, and settings — synced to your account and available from any browser.",
  },
] as const;

export function LandingPillars() {
  return (
    <section className="relative border-t border-border/60">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-linear-to-b from-muted/30 via-muted/15 to-transparent"
      />
      <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
        <div className="mb-16 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl">
            <p className="landing-section-label">Why Forge</p>
            <h2 className="mt-3 font-heading text-[clamp(1.75rem,4vw,2.5rem)] font-semibold leading-tight tracking-tight">
              Built for the daily grind of shipping software.
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-muted-foreground lg:text-right">
            Industrial utility, refined UX — like a workshop bench where every tool has its place.
          </p>
        </div>

        <div className="grid gap-px overflow-hidden rounded-2xl border border-border/60 bg-border/40 sm:grid-cols-3">
          {pillars.map((pillar) => (
            <article
              key={pillar.title}
              className="group relative bg-background/80 p-8 transition-colors hover:bg-background"
            >
              <span className="landing-pillar-index absolute top-6 right-6">{pillar.index}</span>
              <div className="mb-5 flex size-11 items-center justify-center rounded-xl border border-border/60 bg-muted/40 text-primary transition-all duration-300 group-hover:border-primary/35 group-hover:bg-primary/10 group-hover:shadow-[0_0_24px_-4px_color-mix(in_oklch,var(--primary)_35%,transparent)]">
                <pillar.icon className="size-5" />
              </div>
              <h3 className="font-heading text-lg font-semibold tracking-tight">{pillar.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {pillar.description}
              </p>
              <div
                aria-hidden
                className="absolute bottom-0 left-8 h-px w-0 bg-primary/60 transition-all duration-500 group-hover:w-[calc(100%-4rem)]"
              />
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

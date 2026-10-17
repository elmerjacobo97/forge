export function DependencyChips({ dependsOn, known }: { dependsOn: string[]; known: Set<string> }) {
  const visible = dependsOn.filter((slug) => known.has(slug));
  if (visible.length === 0) return null;

  return (
    <ul
      className="flex flex-wrap gap-1"
      aria-label="Depends on"
    >
      {visible.map((slug) => (
        <li
          key={slug}
          className="border border-border px-1.5 py-0.5 font-mono text-[0.625rem] text-muted-foreground"
        >
          → {slug}
        </li>
      ))}
    </ul>
  );
}

import { cn } from "@/lib/utils";

export function Sparkline({ data, className }: { data: number[]; className?: string }) {
  if (data.length < 2 || data.every((value) => value === data[0])) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data
    .map((value, index) => `${(index / (data.length - 1)) * 100},${100 - ((value - min) / range) * 100}`)
    .join(" ");

  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className={cn("h-8 w-16 overflow-visible text-primary", className)}>
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth={6}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

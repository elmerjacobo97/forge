import type { ReactNode } from "react";

type RouteLoadingProps = {
  label: string;
  children: ReactNode;
  className?: string;
};

export function RouteLoading({
  label,
  children,
  className = "flex h-full min-h-0 flex-col gap-4",
}: RouteLoadingProps) {
  return (
    <div
      className={className}
      aria-busy="true"
    >
      <output className="sr-only">Loading {label}…</output>
      <div
        className="contents"
        aria-hidden="true"
      >
        {children}
      </div>
    </div>
  );
}

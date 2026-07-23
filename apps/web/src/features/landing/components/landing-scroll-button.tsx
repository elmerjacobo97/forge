"use client";

import type { ComponentProps, MouseEvent } from "react";

interface LandingScrollButtonProps extends ComponentProps<"button"> {
  targetId: string;
}

export function LandingScrollButton({ targetId, onClick, ...props }: LandingScrollButtonProps) {
  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    onClick?.(event);
    if (event.defaultPrevented) return;

    document.getElementById(targetId)?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      block: "start",
    });
  }

  return (
    <button
      {...props}
      type="button"
      onClick={handleClick}
    />
  );
}

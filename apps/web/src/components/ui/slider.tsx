"use client"

import * as React from "react"
import { Slider as SliderPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

function Slider({
  className,
  defaultValue,
  value,
  ...props
}: React.ComponentProps<typeof SliderPrimitive.Root>) {
  const values = value ?? defaultValue
  return (
    <SliderPrimitive.Root
      data-slot="slider"
      defaultValue={defaultValue}
      value={value}
      className={cn(
        "relative flex w-full touch-none select-none items-center data-disabled:opacity-50",
        className
      )}
      {...props}
    >
      <SliderPrimitive.Track
        data-slot="slider-track"
        className="relative h-1.5 w-full grow shrink-0 rounded-full bg-muted overflow-hidden"
      >
        <SliderPrimitive.Range
          data-slot="slider-range"
          className="absolute h-full bg-primary"
        />
      </SliderPrimitive.Track>
      {Array.from({ length: values?.length ?? 0 }).map((_, i) => (
        <SliderPrimitive.Thumb
          key={i}
          data-slot="slider-thumb"
          className="relative -ml-1 size-4 rounded-full bg-background border-2 border-primary shadow-sm transition-colors hover:border-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none"
        />
      ))}
    </SliderPrimitive.Root>
  )
}

export { Slider }
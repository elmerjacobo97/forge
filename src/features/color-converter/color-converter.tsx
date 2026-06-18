import { useMemo, useState } from "react"
import { Check, Copy, Pipette } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useCopy } from "@/lib/hooks/use-copy"
import { invoke } from "@tauri-apps/api/core"

import {
  hexToRgb,
  hslToRgb,
  rgbToHex,
  rgbToHsl,
  rgbToOkLch,
  type Rgb,
} from "./utils/color"

const SHADE_STEPS = [5, 15, 25, 35, 45, 55, 65, 75, 85, 95]

interface Row {
  label: string
  value: string
}

interface Shade {
  light: number
  hex: string
}

function CopyRow({ label, value }: Row) {
  const { copied, copy } = useCopy()
  return (
    <div className="group flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-muted/50">
      <Badge variant="outline" className="w-16 shrink-0 justify-center font-mono">
        {label}
      </Badge>
      <span className="flex-1 truncate font-mono text-xs">{value}</span>
      <Button
        size="icon-xs"
        variant="ghost"
        onClick={() => copy(value)}
        aria-label={`Copy ${label}`}
        className="opacity-0 transition-opacity group-hover:opacity-100"
      >
        {copied ? <Check className="size-3 text-primary" /> : <Copy className="size-3" />}
      </Button>
    </div>
  )
}

export function ColorConverter() {
  const [hex, setHex] = useState("#d97706")

  const rgb = useMemo<Rgb | null>(() => hexToRgb(hex), [hex])
  const hsl = useMemo(() => (rgb ? rgbToHsl(rgb) : null), [rgb])
  const oklch = useMemo(() => (rgb ? rgbToOkLch(rgb) : null), [rgb])
  const safeHex = rgb ? rgbToHex(rgb) : "#cccccc"

  const rows = useMemo<Row[]>(() => {
    if (!rgb || !hsl || !oklch) return []
    return [
      { label: "HEX", value: rgbToHex(rgb).toUpperCase() },
      { label: "RGB", value: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})` },
      { label: "HSL", value: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)` },
      { label: "OKLCH", value: oklch },
      { label: "RGB values", value: `${rgb.r}, ${rgb.g}, ${rgb.b}` },
    ]
  }, [rgb, hsl, oklch])

  const shades = useMemo<Shade[]>(() => {
    if (!hsl) return []
    return SHADE_STEPS.map((l) => ({
      light: l,
      hex: rgbToHex(hslToRgb({ h: hsl.h, s: hsl.s, l })),
    }))
  }, [hsl])

  const isValid = rgb !== null

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              aria-label="Open color picker"
              className="size-10 shrink-0 rounded-lg border ring-1 ring-border/50"
              style={{ backgroundColor: isValid ? hex : "#ccc" }}
            />
          </PopoverTrigger>
          <PopoverContent align="start" className="w-auto p-3">
            <div className="flex flex-col gap-2">
              <Label className="text-xs font-medium text-muted-foreground">
                Color picker
              </Label>
              <input
                type="color"
                value={safeHex}
                onChange={(e) => setHex(e.target.value)}
                className="size-32 cursor-pointer rounded-lg border-0 bg-transparent p-0"
              />
            </div>
          </PopoverContent>
        </Popover>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-10 shrink-0"
              onClick={async () => {
                try {
                  const hex = await invoke<string>("pick_color")
                  setHex(hex)
                } catch {
                  // cancelled or unsupported
                }
              }}
            >
              <Pipette className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Pick color from screen</TooltipContent>
        </Tooltip>

        <Input
          id="color-hex"
          value={hex}
          onChange={(e) => setHex(e.target.value)}
          placeholder="#d97706"
          className="h-10 w-32 font-mono text-sm"
        />

        {isValid && hsl && (
          <div
            className="flex h-10 items-center gap-2 rounded-lg border px-3"
            style={{ backgroundColor: hex }}
          >
            <span
              className="font-mono text-xs font-medium"
              style={{ color: hsl.l > 50 ? "#000" : "#fff" }}
            >
              {safeHex.toUpperCase()}
            </span>
          </div>
        )}
      </div>

      {!isValid && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
          <Badge variant="destructive">Invalid hex color</Badge>
        </div>
      )}

      {isValid && rows.length > 0 && (
        <div className="flex flex-col gap-1.5 rounded-xl border bg-muted/20 p-3">
          {rows.map((row) => (
            <CopyRow key={row.label} label={row.label} value={row.value} />
          ))}
        </div>
      )}

      {isValid && shades.length > 0 && (
        <div className="flex flex-col gap-2">
          <Label className="text-xs font-medium text-muted-foreground">Shades</Label>
          <div className="flex overflow-hidden rounded-lg ring-1 ring-border/50">
            {shades.map((shade) => (
              <Tooltip key={shade.light}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    onClick={() => setHex(shade.hex)}
                    aria-label={`Load shade ${shade.hex}`}
                    className="h-14 flex-1 rounded-none p-0 transition-transform hover:scale-y-110"
                    style={{ backgroundColor: shade.hex }}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <span className="font-mono">{shade.hex.toUpperCase()}</span>
                  <span className="text-muted-foreground"> — {shade.light}%</span>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

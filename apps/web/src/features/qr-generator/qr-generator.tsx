import { useCallback, useEffect, useState } from "react"
import QRCode from "qrcode"
import { Check, Copy, Download, Eraser } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useCopy } from "@/lib/hooks/use-copy"

type ErrorLevel = "L" | "M" | "Q" | "H"

const LEVELS: { id: ErrorLevel; label: string; desc: string }[] = [
  { id: "L", label: "Low", desc: "~7% recovery" },
  { id: "M", label: "Med", desc: "~15% recovery" },
  { id: "Q", label: "Quart", desc: "~25% recovery" },
  { id: "H", label: "High", desc: "~30% recovery" },
]

const SIZES = [128, 256, 512] as const

export function QrGenerator() {
  const [text, setText] = useState("https://forge.dev")
  const [level, setLevel] = useState<ErrorLevel>("M")
  const [size, setSize] = useState<number>(256)
  const [margin, setMargin] = useState<number>(2)
  const [dark, setDark] = useState("#0f0f0f")
  const [light, setLight] = useState("#ffffff")
  const [dataUrl, setDataUrl] = useState("")
  const { copied, copy } = useCopy()

  const generate = useCallback(async () => {
    if (!text.trim()) {
      setDataUrl("")
      return
    }
    try {
      const url = await QRCode.toDataURL(text, {
        errorCorrectionLevel: level,
        margin,
        width: size,
        color: { dark, light },
      })
      setDataUrl(url)
    } catch {
      setDataUrl("")
    }
  }, [text, level, margin, size, dark, light])

  useEffect(() => {
    void generate()
  }, [generate])

  function download() {
    if (!dataUrl) return
    const a = document.createElement("a")
    a.href = dataUrl
    a.download = `qr-${Date.now()}.png`
    a.click()
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5">
          <Label className="text-xs font-medium text-muted-foreground">Error</Label>
          <ToggleGroup
            type="single"
            value={level}
            onValueChange={(v) => v && setLevel(v as ErrorLevel)}
            variant="outline"
            size="sm"
          >
            {LEVELS.map((l) => (
              <ToggleGroupItem key={l.id} value={l.id} aria-label={l.desc}>
                {l.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>

        <div className="flex items-center gap-1.5">
          <Label className="text-xs font-medium text-muted-foreground">Size</Label>
          <ToggleGroup
            type="single"
            value={String(size)}
            onValueChange={(v) => v && setSize(Number(v))}
            variant="outline"
            size="sm"
          >
            {SIZES.map((s) => (
              <ToggleGroupItem key={s} value={String(s)}>
                {s}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>

        <div className="flex items-center gap-1.5">
          <Label htmlFor="qr-margin" className="text-xs font-medium text-muted-foreground">
            Margin
          </Label>
          <Input
            id="qr-margin"
            type="number"
            min={0}
            max={10}
            value={margin}
            onChange={(e) =>
              setMargin(Math.max(0, Math.min(10, Number(e.target.value) || 0)))
            }
            className="h-8 w-16 text-xs"
          />
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                onClick={() => dataUrl && copy(dataUrl)}
                disabled={!dataUrl}
              >
                {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                {copied ? "Copied" : "Copy"}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Copy as data URL</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="sm" variant="outline" onClick={download} disabled={!dataUrl}>
                <Download className="size-3.5" />
                PNG
              </Button>
            </TooltipTrigger>
            <TooltipContent>Download PNG</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon-sm"
                variant="ghost"
                onClick={() => setText("")}
                disabled={!text}
              >
                <Eraser className="size-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Clear</TooltipContent>
          </Tooltip>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="qr-content" className="text-xs font-medium text-muted-foreground">
          Content
        </Label>
        <Textarea
          id="qr-content"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter text or URL to encode…"
          spellCheck={false}
          className="min-h-20 resize-none rounded-xl border-input/60 font-mono text-xs leading-relaxed"
        />
      </div>

      <div className="flex min-h-0 flex-1 items-center justify-center gap-6 rounded-xl border bg-muted/20 p-6">
        {dataUrl ? (
          <div className="flex flex-col items-center gap-4">
            <div className="rounded-xl bg-white p-3 shadow-sm ring-1 ring-border/50">
              <img src={dataUrl} alt="QR code" className="block" />
            </div>
            <div className="flex items-center gap-4">
              <ColorPicker id="qr-dark" label="Dark" value={dark} onChange={setDark} />
              <ColorPicker id="qr-light" label="Light" value={light} onChange={setLight} />
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">Enter content to generate QR code</p>
        )}
      </div>
    </div>
  )
}

function ColorPicker({
  id,
  label,
  value,
  onChange,
}: {
  id: string
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="flex items-center gap-1.5">
      <Label htmlFor={id} className="text-xs font-medium text-muted-foreground">
        {label}
      </Label>
      <input
        id={id}
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={`${label} QR code color`}
        className="size-7 cursor-pointer rounded-md border ring-1 ring-border/50"
      />
      <code className="font-mono text-[10px] text-muted-foreground">{value}</code>
    </div>
  )
}

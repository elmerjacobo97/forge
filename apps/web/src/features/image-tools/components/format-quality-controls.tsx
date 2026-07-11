import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import type { OutputFormat } from "@/features/image-tools/utils/format"
import { FORMATS } from "@/features/image-tools/utils/format"

interface FormatQualityControlsProps {
  format: OutputFormat
  onFormatChange: (v: OutputFormat) => void
  isLossy: boolean
  quality: number
  onQualityChange: (v: number) => void
}

export function FormatQualityControls({
  format,
  onFormatChange,
  isLossy,
  quality,
  onQualityChange,
}: FormatQualityControlsProps) {
  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <ToggleGroup
          type="single"
          value={format}
          onValueChange={(v) => v && onFormatChange(v as OutputFormat)}
          variant="outline"
          size="sm"
        >
          {FORMATS.map((f) => (
            <ToggleGroupItem key={f.id} value={f.id}>
              {f.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      {isLossy && (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium text-muted-foreground">
              Quality
            </Label>
            <span className="text-xs tabular-nums text-muted-foreground">
              {quality}%
            </span>
          </div>
          <Slider
            value={[quality]}
            onValueChange={(v) => onQualityChange(v[0])}
            min={10}
            max={100}
            step={5}
            className="py-1"
          />
        </div>
      )}
    </>
  )
}

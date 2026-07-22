import { File as FileIcon, Link2, Link2Off } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { formatSize } from "@/features/image-tools/utils/format"
import type { SourceImage } from "@/features/image-tools/utils/format"

interface ImageSourcePanelProps {
  source: SourceImage
  resizeEnabled: boolean
  onResizeEnabledChange: (v: boolean) => void
  targetWidth: number
  targetHeight: number
  lockAspect: boolean
  onApplyResize: (value: number, axis: "w" | "h") => void
  onToggleAspect: () => void
}

export function ImageSourcePanel({
  source,
  resizeEnabled,
  onResizeEnabledChange,
  targetWidth,
  targetHeight,
  lockAspect,
  onApplyResize,
  onToggleAspect,
}: ImageSourcePanelProps) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-muted/20 p-3">
      <div className="flex items-center gap-3">
        <FileIcon className="size-4 shrink-0 text-muted-foreground" />
        <span className="flex-1 truncate text-sm font-medium">
          {source.name}
        </span>
        <Badge variant="ghost" className="text-xs text-muted-foreground">
          {source.width}×{source.height}
        </Badge>
        <Badge variant="ghost" className="text-xs text-muted-foreground">
          {formatSize(source.size)}
        </Badge>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground/80">
            Resize
          </Label>
          <label className="flex h-8 items-center gap-2 text-xs font-medium text-muted-foreground">
            <Checkbox
              checked={resizeEnabled}
              onCheckedChange={(v) => onResizeEnabledChange(v === true)}
            />
            Enable
          </label>
        </div>
        <div
          className={cn(
            "flex items-end gap-2",
            !resizeEnabled && "opacity-50 pointer-events-none",
          )}
        >
          <div className="flex flex-col gap-1">
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground/80">
              Width
            </Label>
            <Input
              type="number"
              value={targetWidth}
              onChange={(e) => onApplyResize(Number(e.target.value), "w")}
              min={1}
              className="h-8 w-24 rounded-lg font-mono text-xs"
            />
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon-sm"
                variant="ghost"
                onClick={onToggleAspect}
                aria-label={lockAspect ? "Unlock aspect" : "Lock aspect"}
                data-state={lockAspect ? "on" : "off"}
              >
                {lockAspect ? (
                  <Link2 className="size-3.5" />
                ) : (
                  <Link2Off className="size-3.5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {lockAspect ? "Aspect locked" : "Aspect unlocked"}
            </TooltipContent>
          </Tooltip>
          <div className="flex flex-col gap-1">
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground/80">
              Height
            </Label>
            <Input
              type="number"
              value={targetHeight}
              onChange={(e) => onApplyResize(Number(e.target.value), "h")}
              min={1}
              className="h-8 w-24 rounded-lg font-mono text-xs"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

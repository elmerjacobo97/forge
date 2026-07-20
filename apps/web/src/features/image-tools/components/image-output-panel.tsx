import Image from "next/image"
import { Download } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { formatSize } from "@/features/image-tools/utils/format"
import type { OutputResult } from "@/features/image-tools/utils/format"

interface ImageOutputPanelProps {
  output: OutputResult
  sizeDelta: string | null
  onDownload: () => void
}

export function ImageOutputPanel({ output, sizeDelta, onDownload }: ImageOutputPanelProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-medium text-muted-foreground">
          Result
        </Label>
        <div className="flex items-center gap-2">
          <Badge variant="ghost" className="text-xs text-muted-foreground">
            {output.width}×{output.height}
          </Badge>
          <Badge variant="ghost" className="text-xs text-muted-foreground">
            {formatSize(output.size)}
          </Badge>
          {sizeDelta && (
            <Badge
              variant="ghost"
              className={cn(
                "text-xs",
                sizeDelta.startsWith("+")
                  ? "text-amber-600 dark:text-amber-500"
                  : "text-emerald-600 dark:text-emerald-500",
              )}
            >
              {sizeDelta}
            </Badge>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="sm" variant="outline" onClick={onDownload}>
                <Download className="size-3.5" />
                Download
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              Save as .{output.format === "jpeg" ? "jpg" : output.format}
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
      <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-auto rounded-xl border bg-muted/20 p-3">
        <Image
          src={output.url}
          alt="Converted preview"
          width={output.width}
          height={output.height}
          unoptimized
          className="max-h-full max-w-full rounded-lg object-contain"
        />
      </div>
    </div>
  )
}

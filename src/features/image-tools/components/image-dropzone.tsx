import { type RefObject } from "react"
import { Upload } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ImageDropzoneProps {
  dragOver: boolean
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void
  onDragEnter: (e: React.DragEvent<HTMLDivElement>) => void
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void
  onDragLeave: (e: React.DragEvent<HTMLDivElement>) => void
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onSelectClick: () => void
  inputRef: RefObject<HTMLInputElement | null>
}

export function ImageDropzone({
  dragOver,
  onDrop,
  onDragEnter,
  onDragOver: onDragOverCb,
  onDragLeave,
  onInputChange,
  onSelectClick,
  inputRef,
}: ImageDropzoneProps) {
  return (
    <div
      onDrop={onDrop}
      onDragEnter={onDragEnter}
      onDragOver={onDragOverCb}
      onDragLeave={onDragLeave}
      className={cn(
        "relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-6 text-center transition-colors",
        dragOver
          ? "border-primary bg-primary/5"
          : "border-input/60 bg-muted/20 hover:border-input hover:bg-muted/30",
      )}
    >
      <div className="flex size-12 items-center justify-center rounded-full bg-muted">
        <Upload className="size-5 text-muted-foreground" />
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-foreground">
          {dragOver ? "Drop image here" : "Drag & drop an image here"}
        </p>
        <p className="text-xs text-muted-foreground">PNG, JPG, WebP, GIF…</p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        aria-label="Select image"
        onChange={onInputChange}
      />
      <Button
        variant="outline"
        size="sm"
        onClick={onSelectClick}
      >
        Select image
      </Button>
    </div>
  )
}

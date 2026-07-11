import { useCallback, useEffect } from "react"
import { Eraser, ImageIcon, Loader2, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useImageSource } from "@/features/image-tools/hooks/use-image-source"
import { useImageConvert } from "@/features/image-tools/hooks/use-image-convert"
import { FormatQualityControls } from "@/features/image-tools/components/format-quality-controls"
import { ImageDropzone } from "@/features/image-tools/components/image-dropzone"
import { ImageSourcePanel } from "@/features/image-tools/components/image-source-panel"
import { ImageOutputPanel } from "@/features/image-tools/components/image-output-panel"

export function ImageTools() {
  const sourceHook = useImageSource()
  const { source, error, dragOver, inputRef, setError } = sourceHook

  const convertHook = useImageConvert(source, { onSetError: setError })
  const {
    format, setFormat,
    quality, setQuality,
    resizeEnabled, setResizeEnabled,
    targetWidth, targetHeight,
    lockAspect, setLockAspect,
    output, loading, isLossy, sizeDelta,
    canvasRef,
    applyResize, convert, downloadOutput, clearOutput, resetOutput,
  } = convertHook

  // Discard any previous conversion whenever a new source image loads
  // File picker and browser drag-drop both use the same conversion flow.
  useEffect(() => {
    resetOutput()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source])

  const handleClear = useCallback(() => {
    sourceHook.clearSource()
    clearOutput()
  }, [sourceHook, clearOutput])

  return (
    <div className="flex h-full flex-col gap-4">
      {/* Top control row */}
      <div className="flex items-center gap-3">
        <FormatQualityControls
          format={format}
          onFormatChange={setFormat}
          isLossy={isLossy}
          quality={quality}
          onQualityChange={setQuality}
        />

        <div className="ml-auto flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="sm" onClick={convert} disabled={!source || loading}>
                {loading ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <ImageIcon className="size-3.5" />
                )}
                Convert
              </Button>
            </TooltipTrigger>
            <TooltipContent>Encode to {format.toUpperCase()}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon-sm"
                variant="ghost"
                onClick={handleClear}
                disabled={!source}
              >
                <Eraser className="size-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Clear</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Dropzone */}
      <ImageDropzone
        dragOver={dragOver}
        onDrop={sourceHook.handleDrop}
        onDragEnter={sourceHook.handleDragEnter}
        onDragOver={sourceHook.handleDragOver}
        onDragLeave={sourceHook.handleDragLeave}
        onInputChange={sourceHook.handleInputChange}
        onSelectClick={() => inputRef.current?.click()}
        inputRef={inputRef}
      />

      {/* Source info + resize controls */}
      {source && (
        <ImageSourcePanel
          source={source}
          resizeEnabled={resizeEnabled}
          onResizeEnabledChange={setResizeEnabled}
          targetWidth={targetWidth}
          targetHeight={targetHeight}
          lockAspect={lockAspect}
          onApplyResize={applyResize}
          onToggleAspect={() => setLockAspect((v) => !v)}
        />
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-destructive">
          <X className="size-4 shrink-0" />
          <span className="text-xs">{error}</span>
        </div>
      )}

      {/* Result */}
      <canvas ref={canvasRef} className="hidden" />
      {output && (
        <ImageOutputPanel
          output={output}
          sizeDelta={sizeDelta}
          onDownload={downloadOutput}
        />
      )}
    </div>
  )
}

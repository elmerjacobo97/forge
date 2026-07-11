import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"
import type { OutputFormat, SourceImage, OutputResult } from "@/features/image-tools/utils/format"
import { FORMATS, LOSSY, formatSize, pctOf } from "@/features/image-tools/utils/format"

interface UseImageConvertOptions {
  onSetError?: (error: string | null) => void
}

export function useImageConvert(
  source: SourceImage | null,
  { onSetError }: UseImageConvertOptions = {},
) {
  const [format, setFormat] = useState<OutputFormat>("webp")
  const [quality, setQuality] = useState(80)
  const [resizeEnabled, setResizeEnabled] = useState(false)
  const [targetWidth, setTargetWidth] = useState(0)
  const [targetHeight, setTargetHeight] = useState(0)
  const [lockAspect, setLockAspect] = useState(true)
  const [output, setOutput] = useState<OutputResult | null>(null)
  const [loading, setLoading] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  const isLossy = LOSSY.includes(format)
  const currentMime = useMemo(() => FORMATS.find((f) => f.id === format)!.mime, [format])

  const sizeDelta = useMemo(() => {
    if (!source || !output) return null
    return pctOf(source.size, output.size)
  }, [source, output])

  useEffect(() => {
    if (source) {
      setTargetWidth(source.width)
      setTargetHeight(source.height)
    }
  }, [source])

  useEffect(() => {
    return () => {
      if (output) URL.revokeObjectURL(output.url)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function applyResize(value: number, axis: "w" | "h") {
    if (!source) return
    if (axis === "w") setTargetWidth(value)
    else setTargetHeight(value)
    if (lockAspect && source.width && source.height) {
      const ratio = source.width / source.height
      if (axis === "w") setTargetHeight(Math.round(value / ratio))
      else setTargetWidth(Math.round(value * ratio))
    }
  }

  const resetOutput = useCallback(() => {
    if (output) URL.revokeObjectURL(output.url)
    setOutput(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [output])

  const convert = useCallback(async () => {
    if (!source) return
    setLoading(true)
    onSetError?.(null)
    resetOutput()
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const el = document.createElement("img")
        el.onload = () => resolve(el)
        el.onerror = () => reject(new Error("Failed to load source image"))
        el.src = source.url
      })

      const w = resizeEnabled
        ? Math.max(1, targetWidth || source.width)
        : source.width
      const h = resizeEnabled
        ? Math.max(1, targetHeight || source.height)
        : source.height

      const canvas = canvasRef.current ?? document.createElement("canvas")
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext("2d")
      if (!ctx) throw new Error("Canvas not supported")
      if (format === "jpeg") {
        ctx.fillStyle = "#ffffff"
        ctx.fillRect(0, 0, w, h)
      }
      ctx.drawImage(img, 0, 0, w, h)

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, currentMime, isLossy ? quality / 100 : undefined),
      )
      if (!blob) throw new Error("Failed to encode image")
      const url = URL.createObjectURL(blob)
      setOutput({ blob, url, width: w, height: h, size: blob.size, format })
      toast.success("Image converted", {
        description: `${formatSize(blob.size)} (${pctOf(source.size, blob.size)})`,
      })
    } catch (e) {
      onSetError?.((e as Error).message || String(e))
      toast.error("Conversion failed", {
        description: (e as Error).message || String(e),
      })
    } finally {
      setLoading(false)
    }
  }, [
    source,
    format,
    quality,
    resizeEnabled,
    targetWidth,
    targetHeight,
    currentMime,
    isLossy,
    resetOutput,
    onSetError,
  ])

  const downloadOutput = useCallback(() => {
    if (!output || !source) return
    const a = document.createElement("a")
    a.href = output.url
    const base = source.name.replace(/\.[^.]+$/, "") ?? "image"
    const ext = output.format === "jpeg" ? "jpg" : output.format
    a.download = `${base}.${ext}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    toast.success("Image downloaded", {
      description: `${base}.${ext}`,
    })
  }, [output, source])

  const clearOutput = useCallback(() => {
    if (output) URL.revokeObjectURL(output.url)
    setOutput(null)
    setLoading(false)
    setResizeEnabled(false)
    setQuality(80)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [output])

  return {
    format,
    setFormat,
    quality,
    setQuality,
    resizeEnabled,
    setResizeEnabled,
    targetWidth,
    setTargetWidth,
    targetHeight,
    setTargetHeight,
    lockAspect,
    setLockAspect,
    output,
    loading,
    isLossy,
    currentMime,
    sizeDelta,
    canvasRef,
    applyResize,
    resetOutput,
    convert,
    downloadOutput,
    clearOutput,
  }
}

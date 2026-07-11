export type OutputFormat = "png" | "jpeg" | "webp"

export const FORMATS: { id: OutputFormat; label: string; mime: string }[] = [
  { id: "png", label: "PNG", mime: "image/png" },
  { id: "jpeg", label: "JPG", mime: "image/jpeg" },
  { id: "webp", label: "WebP", mime: "image/webp" },
]

export const LOSSY: OutputFormat[] = ["jpeg", "webp"]

export interface DragDropPayload {
  paths: string[]
  position: { x: number; y: number }
}

export interface SourceImage {
  name: string
  url: string
  width: number
  height: number
  size: number
  type: string
}

export interface OutputResult {
  blob: Blob
  url: string
  width: number
  height: number
  size: number
  format: OutputFormat
}

export function formatSize(bytes: number): string {
  if (bytes === 0) return "0 B"
  const units = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  const value = bytes / Math.pow(1024, i)
  return `${value.toFixed(i === 0 ? 0 : 1)} ${units[i]}`
}

export function pctOf(a: number, b: number): string {
  if (a === 0 || b === 0) return ""
  const p = ((b - a) / a) * 100
  if (p >= 0) return `+${p.toFixed(0)}%`
  return `${p.toFixed(0)}%`
}

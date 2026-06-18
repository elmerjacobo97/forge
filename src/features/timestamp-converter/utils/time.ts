const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" })

export function formatRelative(date: Date): string {
  const diff = date.getTime() - Date.now()
  const abs = Math.abs(diff)

  if (abs < 60_000) return rtf.format(Math.round(diff / 1000), "second")
  if (abs < 3_600_000) return rtf.format(Math.round(diff / 60_000), "minute")
  if (abs < 86_400_000) return rtf.format(Math.round(diff / 3_600_000), "hour")
  if (abs < 604_800_000) return rtf.format(Math.round(diff / 86_400_000), "day")
  if (abs < 2_592_000_000) return rtf.format(Math.round(diff / 604_800_000), "week")
  if (abs < 31_536_000_000) return rtf.format(Math.round(diff / 2_592_000_000), "month")
  return rtf.format(Math.round(diff / 31_536_000_000), "year")
}

export function safeFormat(date: Date, opts: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat("en-US", opts).format(date)
}

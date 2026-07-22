import { format, formatDistanceToNow } from "date-fns"

export function formatRelative(date: Date): string {
  return formatDistanceToNow(date, { addSuffix: true })
}

export function safeFormat(date: Date, pattern: string): string {
  return format(date, pattern)
}

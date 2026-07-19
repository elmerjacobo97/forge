import type { Bookmark, Ticket } from "./types.js"

function formatDuration(ms: number): string {
  if (ms < 0) ms = 0
  const totalSec = Math.floor(ms / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
  }
  return `${m}:${String(s).padStart(2, "0")}`
}

function formatTimerSummary(ticket: Ticket): string {
  const logged = formatDuration(ticket.totalElapsedMs)
  if (ticket.timerStartedAt) {
    return `running (logged ${logged})`
  }
  if (ticket.isPaused) {
    return `paused (logged ${logged})`
  }
  return `stopped (logged ${logged})`
}

export function formatBookmarkText(bookmark: Bookmark): string {
  const tags = bookmark.tags.length > 0 ? bookmark.tags.join(", ") : "(none)"
  return (
    `id:          ${bookmark.id}\n` +
    `title:       ${bookmark.title}\n` +
    `url:         ${bookmark.url}\n` +
    `category:    ${bookmark.category}\n` +
    `description: ${bookmark.description}\n` +
    `tags:        ${tags}\n` +
    `createdAt:   ${bookmark.createdAt}`
  )
}

export function formatBookmarkListText(bookmarks: Bookmark[]): string {
  if (bookmarks.length === 0) {
    return "No bookmarks."
  }
  return bookmarks.map(formatBookmarkText).join("\n\n")
}

export function formatBookmarkJson(bookmark: Bookmark): string {
  return `${JSON.stringify(bookmark, null, 2)}\n`
}

export function formatBookmarkListJson(bookmarks: Bookmark[]): string {
  return `${JSON.stringify(bookmarks, null, 2)}\n`
}

export function writeBookmarkOutput(
  bookmark: Bookmark,
  json: boolean,
): void {
  process.stdout.write(
    json ? formatBookmarkJson(bookmark) : `${formatBookmarkText(bookmark)}\n`,
  )
}

export function writeBookmarkListOutput(
  bookmarks: Bookmark[],
  json: boolean,
): void {
  process.stdout.write(
    json
      ? formatBookmarkListJson(bookmarks)
      : `${formatBookmarkListText(bookmarks)}\n`,
  )
}

export function formatTicketText(ticket: Ticket): string {
  return (
    `id:          ${ticket.id}\n` +
    `title:       ${ticket.title}\n` +
    `column:      ${ticket.column}\n` +
    `priority:    ${ticket.priority}\n` +
    `description: ${ticket.description || "(none)"}\n` +
    `timer:       ${formatTimerSummary(ticket)}\n` +
    `createdAt:   ${ticket.createdAt}\n` +
    `lastMovedAt: ${ticket.lastMovedAt}`
  )
}

export function formatTicketListText(tickets: Ticket[]): string {
  if (tickets.length === 0) {
    return "No tickets."
  }
  return tickets.map(formatTicketText).join("\n\n")
}

export function formatTicketJson(ticket: Ticket): string {
  return `${JSON.stringify(ticket, null, 2)}\n`
}

export function formatTicketListJson(tickets: Ticket[]): string {
  return `${JSON.stringify(tickets, null, 2)}\n`
}

export function writeTicketOutput(ticket: Ticket, json: boolean): void {
  process.stdout.write(
    json ? formatTicketJson(ticket) : `${formatTicketText(ticket)}\n`,
  )
}

export function writeTicketListOutput(tickets: Ticket[], json: boolean): void {
  process.stdout.write(
    json
      ? formatTicketListJson(tickets)
      : `${formatTicketListText(tickets)}\n`,
  )
}

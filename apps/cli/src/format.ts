import type { Bookmark } from "./types.js"

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

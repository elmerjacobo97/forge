export type ForgeConfig = {
  endpoint: string
  projectId: string
  databaseId: string
  bookmarksTableId: string
}

export type ForgeSession = {
  userId: string
  /** Appwrite session secret (from login cookie / X-Appwrite-Session). */
  sessionSecret: string
}

/** Public capture URL for an endpoint token. */
export function buildWebhookPublicUrl(token: string, fallbackOrigin?: string): string {
  const base = (process.env.NEXT_PUBLIC_APP_URL || fallbackOrigin || "").replace(
    /\/$/,
    "",
  );
  if (!base) {
    throw new Error("NEXT_PUBLIC_APP_URL is not configured");
  }
  return `${base}/api/hooks/${token}`;
}

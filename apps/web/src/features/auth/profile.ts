export function profileAvatarUrl(profile: unknown): string | null {
  if (typeof profile !== "object" || profile === null || !("avatar_url" in profile)) return null;
  const value = profile.avatar_url;
  if (typeof value !== "string" || value.length === 0) return null;

  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return value;
  } catch {
    return null;
  }
}

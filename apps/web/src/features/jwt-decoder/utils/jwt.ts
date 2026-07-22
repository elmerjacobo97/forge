export interface JwtHeader {
  alg?: string
  typ?: string
  kid?: string
  [k: string]: unknown
}

export interface JwtPayload {
  [k: string]: unknown
}

export interface DecodedJwt {
  header: JwtHeader
  payload: JwtPayload
  signature: string
}

function base64UrlDecode(str: string): string {
  const base64 = str.replace(/-/g, "+").replace(/_/g, "/")
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4)
  const binary = atob(padded)
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

export function decodeJwt(token: string): DecodedJwt | null {
  const parts = token.trim().split(".")
  if (parts.length !== 3) return null
  try {
    const header = JSON.parse(base64UrlDecode(parts[0])) as JwtHeader
    const payload = JSON.parse(base64UrlDecode(parts[1])) as JwtPayload
    return { header, payload, signature: parts[2] }
  } catch {
    return null
  }
}

export const KNOWN_CLAIMS: Record<string, string> = {
  iss: "Issuer",
  sub: "Subject",
  aud: "Audience",
  exp: "Expiration",
  nbf: "Not before",
  iat: "Issued at",
  jti: "JWT ID",
  name: "Name",
  email: "Email",
  role: "Role",
  permissions: "Permissions",
}

export function formatTimestampClaim(value: unknown): string | null {
  if (typeof value !== "number") return null
  const date = new Date(value * 1000)
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString()
}

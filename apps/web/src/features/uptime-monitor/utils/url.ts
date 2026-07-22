const PRIVATE_HOSTNAMES = new Set(["localhost", "0.0.0.0", "::1"]);

function isPrivateIpv4(hostname: string): boolean {
  const parts = hostname.split(".").map(Number);
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n) || n < 0 || n > 255)) {
    return false;
  }
  const [a, b] = parts;
  if (a === 127) return true; // loopback
  if (a === 10) return true; // private
  if (a === 172 && b >= 16 && b <= 31) return true; // private
  if (a === 192 && b === 168) return true; // private
  if (a === 169 && b === 254) return true; // link-local / cloud metadata
  return false;
}

function isPrivateIpv6(hostname: string): boolean {
  const normalized = hostname.toLowerCase();
  return (
    normalized === "::1" ||
    normalized.startsWith("fe80:") || // link-local
    normalized.startsWith("fc") || // unique local fc00::/7
    normalized.startsWith("fd") // unique local fc00::/7
  );
}

/** Rejects non-http(s) URLs and URLs pointing at loopback/private/link-local hosts (SSRF guard). */
export function isValidMonitorUrl(value: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return false;
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;

  const hostname = parsed.hostname;
  if (PRIVATE_HOSTNAMES.has(hostname.toLowerCase())) return false;
  if (hostname.includes(":")) return !isPrivateIpv6(hostname);
  return !isPrivateIpv4(hostname);
}

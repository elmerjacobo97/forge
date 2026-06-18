import { md5 } from "./md5"

export type Algo = "md5" | "sha-1" | "sha-256" | "sha-384" | "sha-512"

export const ALGOS: { id: Algo; label: string; bits: number }[] = [
  { id: "md5", label: "MD5", bits: 128 },
  { id: "sha-1", label: "SHA-1", bits: 160 },
  { id: "sha-256", label: "SHA-256", bits: 256 },
  { id: "sha-384", label: "SHA-384", bits: 384 },
  { id: "sha-512", label: "SHA-512", bits: 512 },
]

export async function digest(algo: Algo, text: string): Promise<string> {
  if (algo === "md5") return md5(text)
  const data = new TextEncoder().encode(text)
  const buf = await crypto.subtle.digest(algo, data)
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("")
}

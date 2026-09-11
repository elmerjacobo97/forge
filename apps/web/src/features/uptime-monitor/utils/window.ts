export function windowStartIso(hours: number, now: number = Date.now()): string {
  return new Date(now - hours * 60 * 60 * 1000).toISOString();
}

export const PAGE_SIZE = 12;
export const MIN_VISIBLE = 12;
export const MAX_VISIBLE = 96;

export function parseVisibleParam(value: string | string[] | undefined): number {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === undefined) {
    return PAGE_SIZE;
  }

  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed < MIN_VISIBLE) {
    return PAGE_SIZE;
  }

  return Math.min(parsed, MAX_VISIBLE);
}

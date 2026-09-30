function pad(value: number): string {
  return String(value).padStart(2, "0");
}

export function toLocalDateTimeInput(value: string | null | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function localDateTimeInputToIso(value: string): string | null {
  if (value === "") return null;
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) {
    throw new Error("Choose a valid local date and time.");
  }

  const date = new Date(value);
  if (!Number.isFinite(date.getTime()) || toLocalDateTimeInput(date.toISOString()) !== value) {
    throw new Error("Choose a valid local date and time in your time zone.");
  }
  return date.toISOString();
}

export function formatLocalDateTime(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return null;

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

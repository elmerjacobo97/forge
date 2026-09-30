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

function parseDate(value: string | null): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
}

export function formatShortDateRange(start: string | null, due: string | null): string | null {
  const startDate = parseDate(start);
  const dueDate = parseDate(due);
  if (!startDate && !dueDate) return null;

  const format = (date: Date, withYear: boolean) =>
    new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      ...(withYear ? { year: "numeric" } : {}),
    }).format(date);
  const currentYear = new Date().getFullYear();
  const sameYear = (date: Date) => date.getFullYear() === currentYear;

  if (startDate && dueDate) {
    const withYear = !sameYear(startDate) || !sameYear(dueDate);
    return `${format(startDate, withYear)} → ${format(dueDate, withYear)}`;
  }
  if (startDate) return `From ${format(startDate, !sameYear(startDate))}`;
  return `Due ${format(dueDate as Date, !sameYear(dueDate as Date))}`;
}

export function isOverdue(due: string | null, done: boolean, now: number = Date.now()): boolean {
  const dueDate = parseDate(due);
  return dueDate !== null && !done && dueDate.getTime() < now;
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

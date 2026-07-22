import { generateFieldValue } from "./field-types";
import type { OutputFormat, Schema } from "./types";

const MAX_COUNT = 100;

export function clampCount(n: number): number {
  return Math.max(1, Math.min(MAX_COUNT, Math.floor(n) || 1));
}

function sanitizeKey(name: string, used: Set<string>): string {
  const cleaned = name.trim().replace(/\s+/g, "_");
  if (!cleaned) return `field_${used.size + 1}`;
  let candidate = cleaned;
  let i = 1;
  while (used.has(candidate)) {
    candidate = `${cleaned}_${i}`;
    i++;
  }
  used.add(candidate);
  return candidate;
}

export type GeneratedRecord = Record<string, string>;

export function generateRecords(
  schema: Schema,
  count: number,
): GeneratedRecord[] {
  const capped = clampCount(count);
  const results: GeneratedRecord[] = [];
  const fieldNames = new Set<string>();

  const keys = schema.fields.map((f) => sanitizeKey(f.name, fieldNames));

  for (let i = 0; i < capped; i++) {
    const record: GeneratedRecord = {};
    schema.fields.forEach((field, fi) => {
      record[keys[fi]] = generateFieldValue(field, i);
    });
    results.push(record);
  }

  return results;
}

export function toJson(records: GeneratedRecord[]): string {
  if (records.length === 1) {
    return JSON.stringify(records[0], null, 2);
  }
  return JSON.stringify(records, null, 2);
}

export function toNdjson(records: GeneratedRecord[]): string {
  return records.map((r) => JSON.stringify(r)).join("\n");
}

function csvEscape(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function toCsv(records: GeneratedRecord[], fields: string[]): string {
  if (records.length === 0) return "";
  const header = fields.map(csvEscape).join(",");
  const rows = records.map((r) =>
    fields.map((f) => csvEscape(r[f] ?? "")).join(","),
  );
  return [header, ...rows].join("\n");
}

export function formatOutput(
  records: GeneratedRecord[],
  format: OutputFormat,
  fields: string[],
): string {
  switch (format) {
    case "json":
      return toJson(records);
    case "ndjson":
      return toNdjson(records);
    case "csv":
      return toCsv(records, fields);
  }
}

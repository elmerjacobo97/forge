import type { Schema } from "./types";

const SCHEMA_KEY = "forge_mock-data-generator_schema:v1";

function ensureFieldIds(schema: Schema): Schema {
  return {
    fields: schema.fields.map((field, index) => ({
      ...field,
      id: field.id || `field-${index}-${field.type}`,
    })),
  };
}

export function loadCurrentSchema(): Schema | null {
  try {
    const raw = localStorage.getItem(SCHEMA_KEY);
    if (!raw) return null;
    return ensureFieldIds(JSON.parse(raw) as Schema);
  } catch {
    return null;
  }
}

export function saveCurrentSchema(schema: Schema): void {
  localStorage.setItem(SCHEMA_KEY, JSON.stringify(schema));
}

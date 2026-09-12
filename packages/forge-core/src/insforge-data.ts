export function asRecord(
  value: unknown,
  context: string,
): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(`Invalid ${context}: expected an object.`)
  }
  return value as Record<string, unknown>
}

export function asRows(value: unknown, context: string): unknown[] {
  if (!Array.isArray(value)) {
    throw new Error(`Invalid ${context}: expected an array.`)
  }
  return value
}

export function asSingleRow(value: unknown, context: string): unknown {
  if (Array.isArray(value)) {
    if (value.length !== 1) {
      throw new Error(`Invalid ${context}: expected one row.`)
    }
    return value[0]
  }
  return asRecord(value, context)
}

export function errorMessage(error: unknown, fallback: string): string {
  if (typeof error !== "object" || error === null) return fallback
  const message = (error as Record<string, unknown>).message
  return typeof message === "string" && message.length > 0 ? message : fallback
}

export function throwIfError(error: unknown, fallback: string): void {
  if (error) throw new Error(errorMessage(error, fallback))
}

export function stringField(
  row: Record<string, unknown>,
  field: string,
  context: string,
): string {
  const value = row[field]
  if (typeof value !== "string") {
    throw new Error(`Invalid ${context}: ${field} must be a string.`)
  }
  return value
}

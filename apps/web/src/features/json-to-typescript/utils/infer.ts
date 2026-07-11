export type PrimitiveName = "string" | "number" | "boolean" | "null" | "Date" | "any"

export interface TSPrimitive {
  kind: "primitive"
  name: PrimitiveName
}

export interface TSLiteral {
  kind: "literal"
  value: string | number | boolean
}

export interface TSArray {
  kind: "array"
  element: TSType
}

export interface TSObject {
  kind: "object"
  properties: Record<string, TSProperty>
}

export interface TSUnion {
  kind: "union"
  types: TSType[]
}

export type TSType = TSPrimitive | TSLiteral | TSArray | TSObject | TSUnion

export interface TSProperty {
  type: TSType
  optional: boolean
}

export interface InferOptions {
  detectDates: boolean
  optionalNulls: boolean
  enumThreshold: number
}

function primitive(name: PrimitiveName): TSPrimitive {
  return { kind: "primitive", name }
}

function literal(value: string | number | boolean): TSLiteral {
  return { kind: "literal", value }
}

function union(types: TSType[]): TSType {
  const flat = types.flatMap((t) => (t.kind === "union" ? t.types : [t]))
  const deduped = dedupeTypes(flat)
  if (deduped.length === 1) return deduped[0]
  return { kind: "union", types: deduped }
}

function dedupeTypes(types: TSType[]): TSType[] {
  const result: TSType[] = []
  const seen = new Set<string>()

  for (const t of types) {
    const key = typeKey(t)
    if (!seen.has(key)) {
      seen.add(key)
      result.push(t)
    }
  }

  return result
}

export function typeKey(t: TSType): string {
  switch (t.kind) {
    case "primitive":
      return `p:${t.name}`
    case "literal":
      return `l:${typeof t.value}:${String(t.value)}`
    case "array":
      return `a:${typeKey(t.element)}`
    case "object": {
      const props = Object.entries(t.properties)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => `${k}${v.optional ? "?" : ""}:${typeKey(v.type)}`)
      return `o:{${props.join(",")}}`
    }
    case "union":
      return `u:[${t.types.map(typeKey).join(",")}]`
  }
}

function isISO8601(value: string): boolean {
  const iso = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:?\d{2})?$/
  return iso.test(value)
}

export function inferType(value: unknown, options: InferOptions): TSType {
  if (value === null) return primitive("null")
  if (typeof value === "boolean") return primitive("boolean")
  if (typeof value === "number") return primitive("number")
  if (typeof value === "string") {
    if (options.detectDates && isISO8601(value)) return primitive("Date")
    return literal(value)
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return { kind: "array", element: primitive("any") }
    const elements = value.map((v) => inferType(v, options))
    return { kind: "array", element: mergeTypes(elements, options) }
  }
  if (typeof value === "object") {
    const properties: Record<string, TSProperty> = {}
    for (const [key, v] of Object.entries(value as Record<string, unknown>)) {
      properties[key] = { type: inferType(v, options), optional: false }
    }
    return { kind: "object", properties }
  }
  return primitive("any")
}

export function mergeTypes(types: TSType[], options: InferOptions): TSType {
  if (types.length === 0) return primitive("any")
  if (types.length === 1) return types[0]

  return types.reduce((acc, t) => mergeTwo(acc, t, options))
}

function mergeTwo(a: TSType, b: TSType, options: InferOptions): TSType {
  if (typeKey(a) === typeKey(b)) return a

  // null handling
  if (a.kind === "primitive" && a.name === "null") return handleNull(b, options, true)
  if (b.kind === "primitive" && b.name === "null") return handleNull(a, options, true)

  // objects
  if (a.kind === "object" && b.kind === "object") {
    return mergeObjects(a, b, options)
  }

  // arrays
  if (a.kind === "array" && b.kind === "array") {
    return { kind: "array", element: mergeTwo(a.element, b.element, options) }
  }

  // primitives and literals
  if (
    (a.kind === "primitive" || a.kind === "literal") &&
    (b.kind === "primitive" || b.kind === "literal")
  ) {
    return mergeLiterals(a, b)
  }

  return union([a, b])
}

function handleNull(type: TSType, options: InferOptions, _fromNull: boolean): TSType {
  if (type.kind === "primitive" && type.name === "null") return primitive("null")
  if (options.optionalNulls) {
    // null makes the other type optional; we represent that at property level
    return type
  }
  return union([primitive("null"), type])
}

function mergeLiterals(a: TSType, b: TSType): TSType {
  if (a.kind === "primitive" && b.kind === "primitive" && a.name === b.name) return a
  if (a.kind === "literal" && b.kind === "literal" && a.value === b.value) return a

  // Widen to primitive if types differ fundamentally
  const names = new Set<string>()
  collectPrimitiveNames(a, names)
  collectPrimitiveNames(b, names)

  if (names.has("any")) return primitive("any")

  const types: TSType[] = []
  if (names.has("Date")) types.push(primitive("Date"))
  if (names.has("string")) types.push(primitive("string"))
  if (names.has("number")) types.push(primitive("number"))
  if (names.has("boolean")) types.push(primitive("boolean"))

  if (types.length === 1) return types[0]
  return union(types)
}

function collectPrimitiveNames(type: TSType, names: Set<string>): void {
  if (type.kind === "primitive") {
    names.add(type.name)
  } else if (type.kind === "literal") {
    names.add(typeof type.value)
  } else if (type.kind === "union") {
    type.types.forEach((t) => collectPrimitiveNames(t, names))
  }
}

function mergeObjects(a: TSObject, b: TSObject, options: InferOptions): TSObject {
  const properties: Record<string, TSProperty> = {}
  const keys = new Set([...Object.keys(a.properties), ...Object.keys(b.properties)])

  for (const key of keys) {
    const pa = a.properties[key]
    const pb = b.properties[key]

    if (pa && pb) {
      const merged = mergeProperty(pa, pb, options)
      properties[key] = merged
    } else if (pa) {
      properties[key] = { type: pa.type, optional: true }
    } else if (pb) {
      properties[key] = { type: pb.type, optional: true }
    }
  }

  return { kind: "object", properties }
}

function mergeProperty(a: TSProperty, b: TSProperty, options: InferOptions): TSProperty {
  const hasNull =
    isNullable(a.type) || isNullable(b.type)

  const mergedType = mergeTwo(a.type, b.type, options)

  if (hasNull && options.optionalNulls) {
    return { type: withoutNull(mergedType), optional: true }
  }

  return { type: mergedType, optional: a.optional && b.optional }
}

function isNullable(type: TSType): boolean {
  if (type.kind === "primitive" && type.name === "null") return true
  if (type.kind === "union") return type.types.some(isNullable)
  return false
}

function withoutNull(type: TSType): TSType {
  if (type.kind === "primitive" && type.name === "null") return primitive("any")
  if (type.kind === "union") {
    const filtered = type.types.filter((t) => !(t.kind === "primitive" && t.name === "null"))
    return mergeTypes(filtered, { detectDates: false, optionalNulls: false, enumThreshold: 0 })
  }
  return type
}

export function inferFromSamples(samples: unknown[], options: InferOptions): TSType {
  if (samples.length === 0) return primitive("any")
  const types = samples.map((s) => inferType(s, options))
  return mergeTypes(types, options)
}

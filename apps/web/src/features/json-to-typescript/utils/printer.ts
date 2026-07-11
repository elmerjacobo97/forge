import {
  type InferOptions,
  type TSLiteral,
  type TSObject,
  type TSType,
  typeKey,
} from "@/features/json-to-typescript/utils/infer"
import { parseSamples } from "@/features/json-to-typescript/utils/parse"
import { inferFromSamples } from "@/features/json-to-typescript/utils/infer"

export type OutputMode = "interface" | "type"

export interface PrintOptions extends InferOptions {
  mode: OutputMode
  rootName: string
}

interface NamedType {
  name: string
  type: TSType
}

class Registry {
  private usedNames = new Set<string>()
  private named = new Map<string, NamedType>()

  has(type: TSType): boolean {
    return this.named.has(typeKey(type))
  }

  getName(type: TSType, suggested: string): string {
    const key = typeKey(type)
    const existing = this.named.get(key)
    if (existing) return existing.name

    const name = this.reserveName(suggested)
    this.named.set(key, { name, type })
    return name
  }

  reserveName(base: string): string {
    const clean = base.replace(/[^a-zA-Z0-9]/g, "")
    let name = clean || "Type"
    let i = 2
    while (this.usedNames.has(name)) {
      name = `${clean}${i++}`
    }
    this.usedNames.add(name)
    return name
  }

  entries(): NamedType[] {
    return Array.from(this.named.values())
  }
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function isEnumUnion(type: TSType, threshold: number): boolean {
  if (type.kind !== "union") return false
  const literals = type.types.filter((t) => t.kind === "literal" && typeof t.value === "string")
  return literals.length > 1 && literals.length <= threshold && literals.length === type.types.length
}

function collectNamedTypes(
  type: TSType,
  suggestedName: string,
  registry: Registry,
  isRoot: boolean
): void {
  if (type.kind === "object" && !isRoot) {
    registry.getName(type, suggestedName)
    for (const [key, prop] of Object.entries(type.properties)) {
      collectNamedTypes(prop.type, capitalize(key), registry, false)
    }
    return
  }

  if (type.kind === "object" && isRoot) {
    for (const [key, prop] of Object.entries(type.properties)) {
      collectNamedTypes(prop.type, capitalize(key), registry, false)
    }
    return
  }

  if (type.kind === "array") {
    collectNamedTypes(type.element, suggestedName, registry, false)
    return
  }

  if (type.kind === "union") {
    if (isEnumUnion(type, 10)) {
      registry.getName(type, suggestedName)
      return
    }
    for (const member of type.types) {
      collectNamedTypes(member, suggestedName, registry, false)
    }
  }
}

function formatLiteral(literal: TSLiteral): string {
  if (typeof literal.value === "string") return "string"
  if (typeof literal.value === "number") return "number"
  return "boolean"
}

function formatUnion(types: TSType[], options: PrintOptions): string {
  const parts = new Set<string>()
  let stringEnum: string | null = null

  const stringLiterals: string[] = []
  let hasPrimitiveString = false
  let hasPrimitiveNumber = false
  let hasPrimitiveBoolean = false
  let hasNull = false
  let hasAny = false
  let hasDate = false

  for (const t of types) {
    if (t.kind === "primitive") {
      if (t.name === "string") hasPrimitiveString = true
      else if (t.name === "number") hasPrimitiveNumber = true
      else if (t.name === "boolean") hasPrimitiveBoolean = true
      else if (t.name === "null") hasNull = true
      else if (t.name === "any") hasAny = true
      else if (t.name === "Date") hasDate = true
    } else if (t.kind === "literal") {
      if (typeof t.value === "string") stringLiterals.push(t.value)
      else if (typeof t.value === "number") hasPrimitiveNumber = true
      else hasPrimitiveBoolean = true
    }
  }

  if (hasAny) parts.add("any")
  if (hasDate) parts.add("Date")
  if (hasPrimitiveString || stringLiterals.length > options.enumThreshold) {
    parts.add("string")
  } else if (stringLiterals.length > 1) {
    // Should already be registered as enum; fallback inline
    stringEnum = stringLiterals.map((v) => `"${v}"`).join(" | ")
  } else if (stringLiterals.length === 1) {
    parts.add("string")
  }
  if (hasPrimitiveNumber) parts.add("number")
  if (hasPrimitiveBoolean) parts.add("boolean")
  if (hasNull) parts.add("null")

  if (stringEnum) parts.add(stringEnum)

  const arr = Array.from(parts)
  if (arr.length === 1) return arr[0]
  return arr.join(" | ")
}

function printType(type: TSType, registry: Registry, options: PrintOptions): string {
  switch (type.kind) {
    case "primitive":
      return type.name
    case "literal":
      return formatLiteral(type)
    case "array": {
      const inner = printType(type.element, registry, options)
      return `${inner}[]`
    }
    case "object":
      return registry.getName(type, "Root")
    case "union": {
      if (isEnumUnion(type, options.enumThreshold) && registry.has(type)) {
        return registry.getName(type, "Root")
      }
      return formatUnion(type.types, options)
    }
  }
}

function printObjectBody(type: TSObject, registry: Registry, options: PrintOptions): string {
  const entries = Object.entries(type.properties)
  if (entries.length === 0) return "{}"

  const lines = entries.map(([key, prop]) => {
    const optional = prop.optional ? "?" : ""
    const value = printType(prop.type, registry, options)
    return `  ${key}${optional}: ${value}`
  })

  return `{\n${lines.join("\n")}\n}`
}

function printNamedType(named: NamedType, registry: Registry, options: PrintOptions): string {
  if (named.type.kind === "object") {
    const body = printObjectBody(named.type, registry, options)
    if (options.mode === "interface") {
      return `interface ${named.name} ${body}`
    }
    return `type ${named.name} = ${body}`
  }

  if (named.type.kind === "union") {
    const literals = named.type.types
      .filter((t): t is TSLiteral => t.kind === "literal" && typeof t.value === "string")
      .map((t) => `"${String(t.value)}"`)
    return `type ${named.name} = ${literals.join(" | ")}`
  }

  return `type ${named.name} = ${printType(named.type, registry, options)}`
}

export function generateTypeScript(input: string, options: PrintOptions): { output: string; error: string | null } {
  const { samples, error } = parseSamples(input)
  if (error) return { output: "", error }
  if (samples.length === 0) return { output: "", error: null }

  const inferred = inferFromSamples(samples, options)
  const registry = new Registry()
  collectNamedTypes(inferred, options.rootName, registry, true)

  const lines: string[] = []

  if (options.mode === "interface" && inferred.kind === "object") {
    lines.push(`interface ${options.rootName} ${printObjectBody(inferred, registry, options)}`)
  } else {
    const rhs = printType(inferred, registry, options)
    lines.push(`type ${options.rootName} = ${rhs}`)
  }

  for (const named of registry.entries()) {
    lines.push("")
    lines.push(printNamedType(named, registry, options))
  }

  return { output: lines.join("\n"), error: null }
}

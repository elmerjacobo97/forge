import type { ComponentType } from "react"
import type { LucideIcon } from "lucide-react"
import { Braces, Fingerprint, Binary, Clock, Palette, KeyRound, Regex, Hash, FileCheck, QrCode, Type, Link, ArrowRightLeft, GitCompare } from "lucide-react"

import { JsonFormatter } from "@/features/json-formatter/json-formatter"
import { UuidGenerator } from "@/features/uuid-generator/uuid-generator"
import { Base64Tool } from "@/features/base64/base64"
import { TimestampConverter } from "@/features/timestamp-converter/timestamp-converter"
import { ColorConverter } from "@/features/color-converter/color-converter"
import { JwtDecoder } from "@/features/jwt-decoder/jwt-decoder"
import { RegexTester } from "@/features/regex-tester/regex-tester"
import { HashGenerator } from "@/features/hash-generator/hash-generator"
import { FileValidator } from "@/features/file-validator/file-validator"
import { QrGenerator } from "@/features/qr-generator/qr-generator"
import { TextManipulator } from "@/features/text-manipulator/text-manipulator"
import { UrlEncoder } from "@/features/url-encoder/url-encoder"
import { FormatConverter } from "@/features/format-converter/format-converter"
import { DiffTool } from "@/features/diff-tool/diff-tool"

export interface ToolDef {
  id: string
  name: string
  description: string
  icon: LucideIcon
  category: string
  component: ComponentType
}

export const tools: ToolDef[] = [
  {
    id: "json-formatter",
    name: "JSON Formatter",
    description: "Format, validate, and minify JSON",
    icon: Braces,
    category: "Data",
    component: JsonFormatter,
  },
  {
    id: "uuid-generator",
    name: "UUID Generator",
    description: "Generate v4 and v7 UUIDs",
    icon: Fingerprint,
    category: "Generators",
    component: UuidGenerator,
  },
  {
    id: "base64",
    name: "Base64",
    description: "Encode and decode Base64 with UTF-8 support",
    icon: Binary,
    category: "Encoders",
    component: Base64Tool,
  },
  {
    id: "timestamp-converter",
    name: "Timestamp Converter",
    description: "Convert between Unix timestamps and human-readable dates",
    icon: Clock,
    category: "Converters",
    component: TimestampConverter,
  },
  {
    id: "color-converter",
    name: "Color Converter",
    description: "Convert between HEX, RGB, HSL, and OKLCH",
    icon: Palette,
    category: "Converters",
    component: ColorConverter,
  },
  {
    id: "jwt-decoder",
    name: "JWT Decoder",
    description: "Decode and inspect JWT header and payload",
    icon: KeyRound,
    category: "Decoders",
    component: JwtDecoder,
  },
  {
    id: "regex-tester",
    name: "Regex Tester",
    description: "Test regex patterns with live highlighting and match details",
    icon: Regex,
    category: "Testers",
    component: RegexTester,
  },
  {
    id: "hash-generator",
    name: "Hash Generator",
    description: "Generate MD5, SHA-1, SHA-256, SHA-384, and SHA-512 hashes",
    icon: Hash,
    category: "Generators",
    component: HashGenerator,
  },
  {
    id: "file-validator",
    name: "File Validator",
    description: "Calculate file hashes and verify integrity",
    icon: FileCheck,
    category: "Validators",
    component: FileValidator,
  },
  {
    id: "qr-generator",
    name: "QR Generator",
    description: "Generate QR codes with customizable size, colors, and error correction",
    icon: QrCode,
    category: "Generators",
    component: QrGenerator,
  },
  {
    id: "text-manipulator",
    name: "Text Manipulator",
    description: "Transform text: case convert, sort, dedupe, and more",
    icon: Type,
    category: "Text",
    component: TextManipulator,
  },
  {
    id: "url-encoder",
    name: "URL Encoder",
    description: "Encode and decode URL components with percent-encoding",
    icon: Link,
    category: "Encoders",
    component: UrlEncoder,
  },
  {
    id: "format-converter",
    name: "Format Converter",
    description: "Convert between JSON, YAML, TOML, and more",
    icon: ArrowRightLeft,
    category: "Converters",
    component: FormatConverter,
  },
  {
    id: "diff-tool",
    name: "Diff Tool",
    description: "Compare two texts and highlight line-by-line differences",
    icon: GitCompare,
    category: "Text",
    component: DiffTool,
  },
]

export function getTool(id: string): ToolDef | undefined {
  return tools.find((t) => t.id === id)
}

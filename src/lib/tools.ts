import { lazy, type ComponentType } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Braces,
  Fingerprint,
  Binary,
  Clock,
  Palette,
  KeyRound,
  Regex,
  Hash,
  FileCheck,
  QrCode,
  Type,
  Link,
  ArrowRightLeft,
  GitCompare,
  TextQuote,
  FileCode,
  Code2,
  Globe,
  Bookmark,
  Image as ImageIcon,
  Columns3,
} from "lucide-react";

const jsonFormatter = () =>
  import("@/features/json-formatter/json-formatter").then((m) => ({
    default: m.JsonFormatter,
  }));
const uuidGenerator = () =>
  import("@/features/uuid-generator/uuid-generator").then((m) => ({
    default: m.UuidGenerator,
  }));
const base64Tool = () =>
  import("@/features/base64/base64").then((m) => ({ default: m.Base64Tool }));
const timestampConverter = () =>
  import("@/features/timestamp-converter/timestamp-converter").then((m) => ({
    default: m.TimestampConverter,
  }));
const colorConverter = () =>
  import("@/features/color-converter/color-converter").then((m) => ({
    default: m.ColorConverter,
  }));
const jwtDecoder = () =>
  import("@/features/jwt-decoder/jwt-decoder").then((m) => ({
    default: m.JwtDecoder,
  }));
const regexTester = () =>
  import("@/features/regex-tester/regex-tester").then((m) => ({
    default: m.RegexTester,
  }));
const hashGenerator = () =>
  import("@/features/hash-generator/hash-generator").then((m) => ({
    default: m.HashGenerator,
  }));
const fileValidator = () =>
  import("@/features/file-validator/file-validator").then((m) => ({
    default: m.FileValidator,
  }));
const qrGenerator = () =>
  import("@/features/qr-generator/qr-generator").then((m) => ({
    default: m.QrGenerator,
  }));
const textManipulator = () =>
  import("@/features/text-manipulator/text-manipulator").then((m) => ({
    default: m.TextManipulator,
  }));
const urlEncoder = () =>
  import("@/features/url-encoder/url-encoder").then((m) => ({
    default: m.UrlEncoder,
  }));
const formatConverter = () =>
  import("@/features/format-converter/format-converter").then((m) => ({
    default: m.FormatConverter,
  }));
const diffTool = () =>
  import("@/features/diff-tool/diff-tool").then((m) => ({
    default: m.DiffTool,
  }));
const loremIpsum = () =>
  import("@/features/lorem-ipsum/lorem-ipsum").then((m) => ({
    default: m.LoremIpsum,
  }));
const jsonToTypescript = () =>
  import("@/features/json-to-typescript/json-to-typescript").then((m) => ({
    default: m.JsonToTypescript,
  }));
const htmlEntities = () =>
  import("@/features/html-entities/html-entities").then((m) => ({
    default: m.HtmlEntities,
  }));

const httpTester = () =>
  import("@/features/http-tester/http-tester").then((m) => ({
    default: m.HttpTester,
  }));

const bookmarks = () =>
  import("@/features/bookmarks/bookmarks").then((m) => ({
    default: m.Bookmarks,
  }));

const imageTools = () =>
  import("@/features/image-tools/image-tools").then((m) => ({
    default: m.ImageTools,
  }));

const devBoard = () =>
  import("@/features/dev-board/dev-board").then((m) => ({
    default: m.DevBoard,
  }));

export interface ToolDef {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  category: string;
  component: ComponentType;
}

export const tools: ToolDef[] = [
  {
    id: "json-formatter",
    name: "JSON Formatter",
    description: "Format, validate, and minify JSON",
    icon: Braces,
    category: "Data",
    component: lazy(jsonFormatter),
  },
  {
    id: "uuid-generator",
    name: "UUID Generator",
    description: "Generate v4 and v7 UUIDs",
    icon: Fingerprint,
    category: "Generators",
    component: lazy(uuidGenerator),
  },
  {
    id: "base64",
    name: "Base64",
    description: "Encode and decode Base64 with UTF-8 support",
    icon: Binary,
    category: "Encoders",
    component: lazy(base64Tool),
  },
  {
    id: "timestamp-converter",
    name: "Timestamp Converter",
    description: "Convert between Unix timestamps and human-readable dates",
    icon: Clock,
    category: "Converters",
    component: lazy(timestampConverter),
  },
  {
    id: "color-converter",
    name: "Color Converter",
    description: "Convert between HEX, RGB, HSL, and OKLCH",
    icon: Palette,
    category: "Converters",
    component: lazy(colorConverter),
  },
  {
    id: "jwt-decoder",
    name: "JWT Decoder",
    description: "Decode and inspect JWT header and payload",
    icon: KeyRound,
    category: "Decoders",
    component: lazy(jwtDecoder),
  },
  {
    id: "regex-tester",
    name: "Regex Tester",
    description: "Test regex patterns with live highlighting and match details",
    icon: Regex,
    category: "Testers",
    component: lazy(regexTester),
  },
  {
    id: "hash-generator",
    name: "Hash Generator",
    description: "Generate MD5, SHA-1, SHA-256, SHA-384, and SHA-512 hashes",
    icon: Hash,
    category: "Generators",
    component: lazy(hashGenerator),
  },
  {
    id: "file-validator",
    name: "File Validator",
    description: "Calculate file hashes and verify integrity",
    icon: FileCheck,
    category: "Validators",
    component: lazy(fileValidator),
  },
  {
    id: "qr-generator",
    name: "QR Generator",
    description:
      "Generate QR codes with customizable size, colors, and error correction",
    icon: QrCode,
    category: "Generators",
    component: lazy(qrGenerator),
  },
  {
    id: "text-manipulator",
    name: "Text Manipulator",
    description: "Transform text: case convert, sort, dedupe, and more",
    icon: Type,
    category: "Text",
    component: lazy(textManipulator),
  },
  {
    id: "url-encoder",
    name: "URL Encoder",
    description: "Encode and decode URL components with percent-encoding",
    icon: Link,
    category: "Encoders",
    component: lazy(urlEncoder),
  },
  {
    id: "format-converter",
    name: "Format Converter",
    description: "Convert between JSON, YAML, TOML, and more",
    icon: ArrowRightLeft,
    category: "Converters",
    component: lazy(formatConverter),
  },
  {
    id: "diff-tool",
    name: "Diff Tool",
    description: "Compare two texts and highlight line-by-line differences",
    icon: GitCompare,
    category: "Text",
    component: lazy(diffTool),
  },
  {
    id: "lorem-ipsum",
    name: "Lorem Ipsum",
    description: "Generate placeholder text in plain, HTML, Markdown, or JSON",
    icon: TextQuote,
    category: "Text",
    component: lazy(loremIpsum),
  },
  {
    id: "json-to-typescript",
    name: "JSON to TypeScript",
    description: "Infer TypeScript interfaces or types from JSON",
    icon: FileCode,
    category: "Converters",
    component: lazy(jsonToTypescript),
  },
  {
    id: "html-entities",
    name: "HTML Entities",
    description: "Encode and decode HTML entities (named, decimal, hex)",
    icon: Code2,
    category: "Encoders",
    component: lazy(htmlEntities),
  },
  {
    id: "http-tester",
    name: "HTTP Tester",
    description: "Send HTTP requests and inspect responses (no CORS)",
    icon: Globe,
    category: "Network",
    component: lazy(httpTester),
  },
  {
    id: "bookmarks",
    name: "Bookmarks",
    description: "Save and organize documentation, repos, and articles",
    icon: Bookmark,
    category: "Resources",
    component: lazy(bookmarks),
  },
  {
    id: "image-tools",
    name: "Image Tools",
    description: "Compress and convert PNG, JPG, and WebP images offline",
    icon: ImageIcon,
    category: "Media",
    component: lazy(imageTools),
  },
  {
    id: "dev-board",
    name: "Dev Board",
    description: "Kanban board with auto time tracking for dev tasks",
    icon: Columns3,
    category: "Productivity",
    component: lazy(devBoard),
  },
];

export function getTool(id: string): ToolDef | undefined {
  return tools.find((t) => t.id === id);
}

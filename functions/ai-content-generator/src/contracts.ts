import { z } from "zod";

const tagSchema = z
  .string()
  .trim()
  .min(1)
  .refine((tag) => tag === tag.toLowerCase(), "Tags must be lowercase");

const tagsSchema = z
  .array(tagSchema)
  .min(3)
  .max(5)
  .refine((tags) => new Set(tags).size === tags.length, "Tags must be unique");

const technicalLanguageSchema = z
  .string()
  .trim()
  .min(1)
  .regex(/^[a-z0-9][a-z0-9_+.-]*$/, "Language must be a technical identifier");

export const aiGenerationRequestSchema = z.discriminatedUnion("type", [
  z
    .object({
      type: z.literal("bookmark"),
      title: z.string().trim().min(1),
      url: z.url(),
    })
    .strict(),
  z
    .object({
      type: z.literal("snippet"),
      title: z.string().trim().min(1),
    })
    .strict(),
]);

export const bookmarkGenerationSchema = z
  .object({
    category: z.enum(["docs", "git", "tool", "article", "other"]),
    description: z.string().min(5).max(200),
    tags: tagsSchema,
  })
  .strict();

export const snippetGenerationSchema = z.discriminatedUnion("kind", [
  z
    .object({
      kind: z.enum(["note", "prompt"]),
      content: z.string().min(1).max(4_000),
      language: z.null(),
      tags: tagsSchema,
    })
    .strict(),
  z
    .object({
      kind: z.enum(["config", "snippet"]),
      content: z.string().min(1).max(4_000),
      language: technicalLanguageSchema,
      tags: tagsSchema,
    })
    .strict(),
]);

export const aiGenerationResponseSchema = z.discriminatedUnion("type", [
  z
    .object({
      type: z.literal("bookmark"),
      data: bookmarkGenerationSchema,
    })
    .strict(),
  z
    .object({
      type: z.literal("snippet"),
      data: snippetGenerationSchema,
    })
    .strict(),
]);

export const aiGenerationErrorCodeSchema = z.enum([
  "UNAUTHORIZED",
  "INVALID_INPUT",
  "URL_NOT_ALLOWED",
  "FETCH_FAILED",
  "GENERATION_FAILED",
  "INVALID_RESPONSE",
]);

export const aiGenerationErrorSchema = z
  .object({
    error: z
      .object({
        code: aiGenerationErrorCodeSchema,
        message: z.string().min(1),
      })
      .strict(),
  })
  .strict();

export type AiGenerationRequest = z.infer<typeof aiGenerationRequestSchema>;
export type BookmarkGeneration = z.infer<typeof bookmarkGenerationSchema>;
export type SnippetGeneration = z.infer<typeof snippetGenerationSchema>;
export type AiGenerationResponse = z.infer<typeof aiGenerationResponseSchema>;
export type AiGenerationErrorCode = z.infer<typeof aiGenerationErrorCodeSchema>;
export type AiGenerationError = z.infer<typeof aiGenerationErrorSchema>;

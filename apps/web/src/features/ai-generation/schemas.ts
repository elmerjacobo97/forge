import { z } from "zod";

const tagsSchema = z
  .array(
    z
      .string()
      .trim()
      .min(1)
      .refine((tag) => tag === tag.toLowerCase(), "Tags must be lowercase"),
  )
  .min(3)
  .max(5)
  .refine((tags) => new Set(tags).size === tags.length, "Tags must be unique");

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

const bookmarkGenerationSchema = z
  .object({
    category: z.enum(["docs", "git", "tool", "article", "other"]),
    description: z.string().min(5).max(200),
    tags: tagsSchema,
  })
  .strict();

const snippetGenerationSchema = z.discriminatedUnion("kind", [
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
      language: z
        .string()
        .trim()
        .min(1)
        .regex(/^[a-z0-9][a-z0-9_+.-]*$/),
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

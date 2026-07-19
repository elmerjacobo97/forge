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
  z.strictObject({
    type: z.literal("bookmark"),
    title: z.string().trim().min(1),
    url: z.url(),
  }),
  z.strictObject({
    type: z.literal("snippet"),
    title: z.string().trim().min(1),
  }),
]);

const bookmarkGenerationSchema = z.strictObject({
  category: z.enum(["docs", "git", "tool", "article", "other"]),
  description: z.string().min(5).max(200),
  tags: tagsSchema,
});

const snippetGenerationSchema = z.discriminatedUnion("kind", [
  z.strictObject({
    kind: z.enum(["note", "prompt"]),
    content: z.string().min(1).max(4_000),
    language: z.null(),
    tags: tagsSchema,
  }),
  z.strictObject({
    kind: z.enum(["config", "snippet"]),
    content: z.string().min(1).max(4_000),
    language: z
      .string()
      .trim()
      .min(1)
      .regex(/^[a-z0-9][a-z0-9_+.-]*$/),
    tags: tagsSchema,
  }),
]);

export const aiGenerationResponseSchema = z.discriminatedUnion("type", [
  z.strictObject({
    type: z.literal("bookmark"),
    data: bookmarkGenerationSchema,
  }),
  z.strictObject({
    type: z.literal("snippet"),
    data: snippetGenerationSchema,
  }),
]);

export const aiGenerationErrorCodeSchema = z.enum([
  "UNAUTHORIZED",
  "INVALID_INPUT",
  "URL_NOT_ALLOWED",
  "FETCH_FAILED",
  "GENERATION_FAILED",
  "INVALID_RESPONSE",
]);

export const aiGenerationErrorSchema = z.strictObject({
  error: z.strictObject({
    code: aiGenerationErrorCodeSchema,
    message: z.string().min(1),
  }),
});

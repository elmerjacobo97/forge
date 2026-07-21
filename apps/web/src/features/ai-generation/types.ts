import type { z } from "zod";

import type {
  aiGenerationErrorCodeSchema,
  aiGenerationErrorSchema,
  aiGenerationRequestSchema,
  aiGenerationResponseSchema,
} from "./schemas";

export type AiGenerationRequest = z.infer<typeof aiGenerationRequestSchema>;
export type AiGenerationResponse = z.infer<typeof aiGenerationResponseSchema>;
export type AiGenerationErrorCode = z.infer<typeof aiGenerationErrorCodeSchema>;
export type AiGenerationError = z.infer<typeof aiGenerationErrorSchema>;

export type BookmarkGeneration = Extract<
  AiGenerationResponse,
  { type: "bookmark" }
>["data"];

export type ResourceGeneration = Extract<
  AiGenerationResponse,
  { type: "resource" }
>["data"];

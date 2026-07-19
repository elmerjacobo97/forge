import { describe, expect, it } from "vitest";

import {
  aiGenerationErrorSchema,
  aiGenerationRequestSchema,
  aiGenerationResponseSchema,
} from "./contracts.js";

describe("aiGenerationRequestSchema", () => {
  it.each([
    {
      type: "bookmark",
      title: "Zod documentation",
      url: "https://zod.dev/",
    },
    {
      type: "snippet",
      title: "Configure strict TypeScript",
    },
  ])("accepts a valid $type request", (request) => {
    expect(aiGenerationRequestSchema.parse(request)).toEqual(request);
  });

  it.each([
    { type: "bookmark", url: "https://example.com" },
    { type: "bookmark", title: "Example" },
    { type: "snippet" },
  ])("rejects missing required fields", (request) => {
    expect(aiGenerationRequestSchema.safeParse(request).success).toBe(false);
  });

  it("rejects unknown generation modes", () => {
    expect(
      aiGenerationRequestSchema.safeParse({
        type: "article",
        title: "Example",
      }).success,
    ).toBe(false);
  });
});

describe("public contracts", () => {
  it("validates discriminated responses", () => {
    expect(
      aiGenerationResponseSchema.safeParse({
        type: "bookmark",
        data: {
          category: "docs",
          description: "Official Zod documentation.",
          tags: ["zod", "typescript", "validation"],
        },
      }).success,
    ).toBe(true);
  });

  it("validates public errors", () => {
    expect(
      aiGenerationErrorSchema.safeParse({
        error: {
          code: "INVALID_INPUT",
          message: "Request input is invalid.",
        },
      }).success,
    ).toBe(true);
  });
});

import {
  aiGenerationErrorSchema,
  aiGenerationRequestSchema,
  aiGenerationResponseSchema,
} from "../schemas";
import type {
  AiGenerationErrorCode,
  AiGenerationRequest,
  AiGenerationResponse,
} from "../types";

type Fetcher = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

export class AiGenerationServiceError extends Error {
  constructor(
    message: string,
    readonly code?: AiGenerationErrorCode,
  ) {
    super(message);
    this.name = "AiGenerationServiceError";
  }
}

function invalidResponseError() {
  return new AiGenerationServiceError(
    "The AI service returned an invalid response.",
    "INVALID_RESPONSE",
  );
}

async function parseBody(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    throw invalidResponseError();
  }
}

export function createAiGenerationService(
  fetcher: Fetcher,
) {
  return {
    async generate(input: AiGenerationRequest): Promise<AiGenerationResponse> {
      const request = aiGenerationRequestSchema.safeParse(input);
      if (!request.success) {
        throw new AiGenerationServiceError("AI generation input is invalid.", "INVALID_INPUT");
      }

      let response: Response;
      try {
        response = await fetcher("/api/ai-content", {
          method: "POST",
          body: JSON.stringify(request.data),
          headers: { "content-type": "application/json" },
          credentials: "same-origin",
        });
      } catch {
        throw new AiGenerationServiceError("AI generation request failed.", "GENERATION_FAILED");
      }

      const body = await parseBody(response);
      if (!response.ok) {
        const parsedError = aiGenerationErrorSchema.safeParse(body);
        if (!parsedError.success) {
          throw invalidResponseError();
        }
        throw new AiGenerationServiceError(
          parsedError.data.error.message,
          parsedError.data.error.code,
        );
      }

      const parsedResponse = aiGenerationResponseSchema.safeParse(body);
      if (!parsedResponse.success || parsedResponse.data.type !== request.data.type) {
        throw invalidResponseError();
      }
      return parsedResponse.data;
    },
  };
}

export const aiGenerationService = createAiGenerationService(
  fetch,
);

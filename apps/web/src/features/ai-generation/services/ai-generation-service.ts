import { ExecutionMethod, type Models } from "appwrite";

import { functions } from "@/lib/appwrite";

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

interface FunctionsExecutor {
  createExecution(params: {
    functionId: string;
    body: string;
    async: false;
    method: ExecutionMethod;
    headers: Record<string, string>;
  }): Promise<Pick<Models.Execution, "responseBody" | "responseStatusCode">>;
}

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

function parseBody(responseBody: string): unknown {
  try {
    return JSON.parse(responseBody);
  } catch {
    throw invalidResponseError();
  }
}

export function createAiGenerationService(
  functions: FunctionsExecutor,
  functionId: string,
) {
  return {
    async generate(input: AiGenerationRequest): Promise<AiGenerationResponse> {
      if (!functionId) {
        throw new AiGenerationServiceError("AI generation is not configured.");
      }

      const request = aiGenerationRequestSchema.safeParse(input);
      if (!request.success) {
        throw new AiGenerationServiceError("AI generation input is invalid.", "INVALID_INPUT");
      }

      let execution: Pick<Models.Execution, "responseBody" | "responseStatusCode">;
      try {
        execution = await functions.createExecution({
          functionId,
          body: JSON.stringify(request.data),
          async: false,
          method: ExecutionMethod.POST,
          headers: { "content-type": "application/json" },
        });
      } catch {
        throw new AiGenerationServiceError("AI generation request failed.", "GENERATION_FAILED");
      }

      const body = parseBody(execution.responseBody);
      if (execution.responseStatusCode < 200 || execution.responseStatusCode >= 300) {
        const parsedError = aiGenerationErrorSchema.safeParse(body);
        if (!parsedError.success) {
          throw invalidResponseError();
        }
        throw new AiGenerationServiceError(
          parsedError.data.error.message,
          parsedError.data.error.code,
        );
      }

      const response = aiGenerationResponseSchema.safeParse(body);
      if (!response.success || response.data.type !== request.data.type) {
        throw invalidResponseError();
      }
      return response.data;
    },
  };
}

export const aiGenerationService = createAiGenerationService(
  functions,
  import.meta.env.VITE_APPWRITE_AI_CONTENT_FUNCTION_ID,
);

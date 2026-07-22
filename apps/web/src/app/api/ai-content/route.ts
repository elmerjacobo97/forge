import { setDefaultResultOrder } from "node:dns";

import { getCurrentUser } from "@/features/auth/server";
import { aiGenerationRequestSchema } from "@/features/ai-generation/schemas";
import type { AiGenerationError, AiGenerationErrorCode } from "@/features/ai-generation/types";
import { sanitizeErrorDetail } from "@/features/ai-generation/server/error-detail";
import { FetchPageError, fetchPageContext } from "@/features/ai-generation/server/fetch-page";
import { GenerationError, generateContent } from "@/features/ai-generation/server/generate-content";

// Node.js is Next's default runtime; node:* imports intentionally keep this route Node-only.
setDefaultResultOrder("ipv4first");

interface RouteDependencies {
  getCurrentUser: typeof getCurrentUser;
  fetchPageContext: typeof fetchPageContext;
  generateContent: typeof generateContent;
}

const errorResponses: Record<AiGenerationErrorCode, { message: string; statusCode: number }> = {
  UNAUTHORIZED: { message: "Authentication is required.", statusCode: 401 },
  INVALID_INPUT: { message: "Request input is invalid.", statusCode: 400 },
  URL_NOT_ALLOWED: { message: "The bookmark URL is not allowed.", statusCode: 400 },
  FETCH_FAILED: { message: "The bookmark page could not be fetched.", statusCode: 422 },
  GENERATION_FAILED: { message: "AI generation failed.", statusCode: 502 },
  INVALID_RESPONSE: { message: "AI returned an invalid response.", statusCode: 502 },
};

function publicError(code: AiGenerationErrorCode, status = errorResponses[code].statusCode): Response {
  const body: AiGenerationError = { error: { code, message: errorResponses[code].message } };
  return Response.json(body, { status });
}

export function createPostHandler(
  dependencies: RouteDependencies = { getCurrentUser, fetchPageContext, generateContent },
) {
  return async (request: Request): Promise<Response> => {
    if (!(await dependencies.getCurrentUser())) return publicError("UNAUTHORIZED");

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return publicError("INVALID_INPUT");
    }
    const parsedRequest = aiGenerationRequestSchema.safeParse(body);
    if (!parsedRequest.success) return publicError("INVALID_INPUT");

    try {
      if (parsedRequest.data.type === "bookmark") {
        const page = await dependencies.fetchPageContext(parsedRequest.data.url);
        const response = await dependencies.generateContent({ ...parsedRequest.data, page });
        return Response.json(response);
      }
      return Response.json(await dependencies.generateContent(parsedRequest.data));
    } catch (error) {
      if (error instanceof FetchPageError) {
        console.error(`Bookmark fetch failed with ${error.code}: ${sanitizeErrorDetail(error)}`);
        return publicError(error.code);
      }
      if (error instanceof GenerationError) {
        console.error(`AI generation failed with ${error.code}: ${sanitizeErrorDetail(error)}`);
        return publicError(error.code);
      }
      console.error(`Unhandled AI content generation failure: ${sanitizeErrorDetail(error)}`);
      return publicError("GENERATION_FAILED", 500);
    }
  };
}

export const POST = createPostHandler();

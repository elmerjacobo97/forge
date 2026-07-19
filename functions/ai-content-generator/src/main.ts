import {
  aiGenerationRequestSchema,
  type AiGenerationError,
  type AiGenerationErrorCode,
} from "./contracts.js";
import { FetchPageError, fetchPageContext } from "./fetch-page.js";
import { GenerationError, generateContent } from "./generate-content.js";

interface RuntimeRequest {
  bodyJson: unknown;
  headers: Record<string, string | undefined>;
}

interface RuntimeResponse {
  json(body: unknown, statusCode?: number): unknown;
}

interface RuntimeContext {
  req: RuntimeRequest;
  res: RuntimeResponse;
  error(message: string): void;
}

interface HandlerDependencies {
  fetchPageContext: typeof fetchPageContext;
  generateContent: typeof generateContent;
}

const errorResponses: Record<
  AiGenerationErrorCode,
  { message: string; statusCode: number }
> = {
  UNAUTHORIZED: {
    message: "Authentication is required.",
    statusCode: 401,
  },
  INVALID_INPUT: {
    message: "Request input is invalid.",
    statusCode: 400,
  },
  URL_NOT_ALLOWED: {
    message: "The bookmark URL is not allowed.",
    statusCode: 400,
  },
  FETCH_FAILED: {
    message: "The bookmark page could not be fetched.",
    statusCode: 422,
  },
  GENERATION_FAILED: {
    message: "AI generation failed.",
    statusCode: 502,
  },
  INVALID_RESPONSE: {
    message: "AI returned an invalid response.",
    statusCode: 502,
  },
};

function publicError(
  res: RuntimeResponse,
  code: AiGenerationErrorCode,
  statusCode = errorResponses[code].statusCode,
) {
  const body: AiGenerationError = {
    error: {
      code,
      message: errorResponses[code].message,
    },
  };
  return res.json(body, statusCode);
}

export function createHandler(
  dependencies: HandlerDependencies = { fetchPageContext, generateContent },
) {
  return async ({ req, res, error: reportError }: RuntimeContext) => {
    if (!req.headers["x-appwrite-user-jwt"]?.trim()) {
      return publicError(res, "UNAUTHORIZED");
    }

    const request = aiGenerationRequestSchema.safeParse(req.bodyJson);
    if (!request.success) {
      return publicError(res, "INVALID_INPUT");
    }

    try {
      if (request.data.type === "bookmark") {
        const page = await dependencies.fetchPageContext(request.data.url);
        const response = await dependencies.generateContent({
          type: "bookmark",
          title: request.data.title,
          url: request.data.url,
          page,
        });
        return res.json(response, 200);
      }

      const response = await dependencies.generateContent({
        type: "snippet",
        title: request.data.title,
      });
      return res.json(response, 200);
    } catch (caughtError) {
      if (caughtError instanceof FetchPageError) {
        reportError(`Bookmark fetch failed with ${caughtError.code}.`);
        return publicError(res, caughtError.code);
      }

      if (caughtError instanceof GenerationError) {
        reportError(`AI generation failed with ${caughtError.code}.`);
        return publicError(res, caughtError.code);
      }

      reportError("Unhandled AI content generation failure.");
      return publicError(res, "GENERATION_FAILED", 500);
    }
  };
}

export default createHandler();

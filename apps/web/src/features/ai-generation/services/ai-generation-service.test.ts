import { describe, expect, it, vi } from "vitest";
import {
  AiGenerationServiceError,
  createAiGenerationService,
} from "./ai-generation-service";

const bookmarkRequest = {
  type: "bookmark" as const,
  title: "Appwrite",
  url: "https://appwrite.io/",
};

const bookmarkResponse = {
  type: "bookmark" as const,
  data: {
    category: "docs" as const,
    description: "Appwrite documentation and product resources.",
    tags: ["appwrite", "backend", "docs"],
  },
};

const snippetResponse = {
  type: "snippet" as const,
  data: {
    kind: "snippet" as const,
    content: "const answer = 42;",
    language: "typescript",
    tags: ["typescript", "constant", "example"],
  },
};

function setup(responseBody: unknown = bookmarkResponse, responseStatusCode = 200) {
  const fetcher = vi.fn(async () =>
    new Response(
      typeof responseBody === "string" ? responseBody : JSON.stringify(responseBody),
      { status: responseStatusCode, headers: { "content-type": "application/json" } },
    ),
  );
  const service = createAiGenerationService(fetcher);
  return { fetcher, service };
}

describe("aiGenerationService", () => {
  it("calls the Route Handler and validates a bookmark response", async () => {
    const { fetcher, service } = setup();

    await expect(service.generate(bookmarkRequest)).resolves.toEqual(bookmarkResponse);
    expect(fetcher).toHaveBeenCalledWith("/api/ai-content", {
      method: "POST",
      body: JSON.stringify(bookmarkRequest),
      headers: { "content-type": "application/json" },
      credentials: "same-origin",
    });
  });

  it("validates a snippet response", async () => {
    const { service } = setup(snippetResponse);

    await expect(
      service.generate({ type: "snippet", title: "TypeScript constant" }),
    ).resolves.toEqual(snippetResponse);
  });

  it("rejects invalid input before executing the Function", async () => {
    const { fetcher, service } = setup();

    await expect(
      service.generate({ type: "bookmark", title: "Missing URL" } as never),
    ).rejects.toMatchObject({ code: "INVALID_INPUT" });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it.each([
    "not json",
    { type: "bookmark", data: { category: "docs" } },
    snippetResponse,
    { unrelated: true },
  ])("rejects invalid or mismatched successful responses", async (body) => {
    const { service } = setup(body);

    await expect(service.generate(bookmarkRequest)).rejects.toMatchObject({
      code: "INVALID_RESPONSE",
    });
  });

  it("preserves validated public Function errors", async () => {
    const { service } = setup(
      {
        error: {
          code: "FETCH_FAILED",
          message: "The bookmark page could not be fetched.",
        },
      },
      422,
    );

    await expect(service.generate(bookmarkRequest)).rejects.toEqual(
      new AiGenerationServiceError(
        "The bookmark page could not be fetched.",
        "FETCH_FAILED",
      ),
    );
  });

  it("rejects malformed Function error responses", async () => {
    const { service } = setup({ error: { code: "UNKNOWN", message: "private" } }, 500);

    await expect(service.generate(bookmarkRequest)).rejects.toMatchObject({
      code: "INVALID_RESPONSE",
      message: "The AI service returned an invalid response.",
    });
  });

  it("hides transport errors", async () => {
    const { fetcher, service } = setup();
    fetcher.mockRejectedValueOnce(new Error("internal transport detail"));

    await expect(service.generate(bookmarkRequest)).rejects.toEqual(
      new AiGenerationServiceError("AI generation request failed.", "GENERATION_FAILED"),
    );
  });
});

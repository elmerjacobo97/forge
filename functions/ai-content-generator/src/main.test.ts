import { describe, expect, it, vi } from "vitest";

import type { AiGenerationResponse } from "./contracts.js";
import { FetchPageError, type FetchedPageContext } from "./fetch-page.js";
import { GenerationError } from "./generate-content.js";
import { createHandler } from "./main.js";

const pageContext: FetchedPageContext = {
  finalUrl: "https://example.com/",
  title: "Example",
  description: "Example page.",
  text: "Example page content.",
};

const bookmarkResponse: AiGenerationResponse = {
  type: "bookmark",
  data: {
    category: "article",
    description: "An example public page.",
    tags: ["example", "article", "reference"],
  },
};

const snippetResponse: AiGenerationResponse = {
  type: "snippet",
  data: {
    kind: "note",
    content: "Remember to review the example.",
    language: null,
    tags: ["example", "note", "review"],
  },
};

function setup({
  fetchResult = pageContext,
  generationResult = bookmarkResponse,
}: {
  fetchResult?: FetchedPageContext;
  generationResult?: AiGenerationResponse;
} = {}) {
  const fetchPageContext = vi.fn(async () => fetchResult);
  const generateContent = vi.fn(async () => generationResult);
  const handler = createHandler({ fetchPageContext, generateContent });
  const json = vi.fn((body: unknown, statusCode = 200) => ({ body, statusCode }));
  const reportError = vi.fn();

  async function invoke(
    bodyJson: unknown,
    headers: Record<string, string | undefined> = { "x-appwrite-user-jwt": "jwt" },
  ) {
    return await handler({
      req: { bodyJson, headers },
      res: { json },
      error: reportError,
    });
  }

  return { fetchPageContext, generateContent, invoke, json, reportError };
}

describe("AI content generator handler", () => {
  it("rejects unauthenticated executions before processing input", async () => {
    const { fetchPageContext, generateContent, invoke } = setup();

    await expect(
      invoke({ type: "snippet", title: "Example" }, {}),
    ).resolves.toEqual({
      statusCode: 401,
      body: {
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication is required.",
        },
      },
    });
    expect(fetchPageContext).not.toHaveBeenCalled();
    expect(generateContent).not.toHaveBeenCalled();
  });

  it.each([
    null,
    { type: "bookmark", title: "Missing URL" },
    { type: "snippet", title: "" },
    { type: "unknown", title: "Example" },
  ])("rejects invalid input", async (input) => {
    const { generateContent, invoke } = setup();

    await expect(invoke(input)).resolves.toMatchObject({
      statusCode: 400,
      body: { error: { code: "INVALID_INPUT" } },
    });
    expect(generateContent).not.toHaveBeenCalled();
  });

  it("fetches page context before generating a bookmark", async () => {
    const { fetchPageContext, generateContent, invoke } = setup();

    await expect(
      invoke({
        type: "bookmark",
        title: "Example",
        url: "https://example.com/",
      }),
    ).resolves.toEqual({ statusCode: 200, body: bookmarkResponse });
    expect(fetchPageContext).toHaveBeenCalledWith("https://example.com/");
    expect(generateContent).toHaveBeenCalledWith({
      type: "bookmark",
      title: "Example",
      url: "https://example.com/",
      page: pageContext,
    });
  });

  it("generates a snippet from its title without fetching a page", async () => {
    const { fetchPageContext, generateContent, invoke } = setup({
      generationResult: snippetResponse,
    });

    await expect(
      invoke({ type: "snippet", title: "Review reminder" }),
    ).resolves.toEqual({ statusCode: 200, body: snippetResponse });
    expect(fetchPageContext).not.toHaveBeenCalled();
    expect(generateContent).toHaveBeenCalledWith({
      type: "snippet",
      title: "Review reminder",
    });
  });
});

describe("handler error mapping", () => {
  it.each([
    ["URL_NOT_ALLOWED", 400],
    ["FETCH_FAILED", 422],
  ] as const)("maps %s fetch failures", async (code, statusCode) => {
    const context = setup();
    context.fetchPageContext.mockRejectedValueOnce(new FetchPageError(code, "private detail"));

    await expect(
      context.invoke({ type: "bookmark", title: "Example", url: "https://example.com/" }),
    ).resolves.toMatchObject({ statusCode, body: { error: { code } } });
    expect(JSON.stringify(context.json.mock.calls)).not.toContain("private detail");
  });

  it.each([
    ["GENERATION_FAILED", 502],
    ["INVALID_RESPONSE", 502],
  ] as const)("maps %s generation failures", async (code, statusCode) => {
    const context = setup({ generationResult: snippetResponse });
    context.generateContent.mockRejectedValueOnce(new GenerationError(code, "provider detail"));

    await expect(
      context.invoke({ type: "snippet", title: "Example" }),
    ).resolves.toMatchObject({ statusCode, body: { error: { code } } });
    expect(JSON.stringify(context.json.mock.calls)).not.toContain("provider detail");
    expect(context.reportError).toHaveBeenCalledWith(
      expect.stringContaining(`AI generation failed with ${code}: provider detail`),
    );
  });

  it("hides unexpected errors and secrets", async () => {
    const context = setup({ generationResult: snippetResponse });
    context.generateContent.mockRejectedValueOnce(
      new Error("GROQ_API_KEY=secret internal provider failure"),
    );

    await expect(
      context.invoke({ type: "snippet", title: "Example" }),
    ).resolves.toEqual({
      statusCode: 500,
      body: {
        error: {
          code: "GENERATION_FAILED",
          message: "AI generation failed.",
        },
      },
    });
    expect(JSON.stringify(context.json.mock.calls)).not.toContain("secret");
    expect(JSON.stringify(context.reportError.mock.calls)).not.toContain("secret");
    expect(context.reportError).toHaveBeenCalledWith(
      expect.stringContaining("[redacted]"),
    );
  });
});

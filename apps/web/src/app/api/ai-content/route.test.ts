import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/features/auth/server", () => ({ getCurrentUser: vi.fn() }));

import type { AiGenerationResponse } from "@/features/ai-generation/types";
import { FetchPageError, type FetchedPageContext } from "@/features/ai-generation/server/fetch-page";
import { GenerationError } from "@/features/ai-generation/server/generate-content";
import { createPostHandler } from "./route";

const user = { id: "user-1", email: "dev@example.com", name: "Developer" };
const page: FetchedPageContext = {
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
const resourceResponse: AiGenerationResponse = {
  type: "resource",
  data: {
    kind: "note",
    content: "Remember to review the example.",
    language: null,
    tags: ["example", "note", "review"],
  },
};

function setup(authenticated = true) {
  const getCurrentUser = vi.fn(async () => authenticated ? user : null);
  const fetchPageContext = vi.fn(async () => page);
  const generateContent = vi.fn(async () => bookmarkResponse);
  const post = createPostHandler({ getCurrentUser, fetchPageContext, generateContent });
  const invoke = (body: unknown) => post(new Request("http://localhost/api/ai-content", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  }));
  return { fetchPageContext, generateContent, invoke };
}

beforeEach(() => vi.spyOn(console, "error").mockImplementation(() => undefined));

describe("POST /api/ai-content", () => {
  it("rejects unauthenticated requests before processing input", async () => {
    const context = setup(false);
    const response = await context.invoke({ type: "resource", title: "Example" });
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: { code: "UNAUTHORIZED", message: "Authentication is required." },
    });
    expect(context.generateContent).not.toHaveBeenCalled();
  });

  it.each([null, { type: "bookmark", title: "Missing URL" }, { type: "resource", title: "" }])(
    "rejects invalid input",
    async (input) => {
      const context = setup();
      const response = await context.invoke(input);
      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toMatchObject({ error: { code: "INVALID_INPUT" } });
      expect(context.generateContent).not.toHaveBeenCalled();
    },
  );

  it("fetches page context before generating bookmark content", async () => {
    const context = setup();
    const response = await context.invoke({
      type: "bookmark", title: "Example", url: "https://example.com/",
    });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(bookmarkResponse);
    expect(context.fetchPageContext).toHaveBeenCalledWith("https://example.com/");
    expect(context.generateContent).toHaveBeenCalledWith({
      type: "bookmark", title: "Example", url: "https://example.com/", page,
    });
  });

  it("generates resources without fetching a page", async () => {
    const context = setup();
    context.generateContent.mockResolvedValueOnce(resourceResponse);
    const response = await context.invoke({ type: "resource", title: "Review reminder" });
    await expect(response.json()).resolves.toEqual(resourceResponse);
    expect(context.fetchPageContext).not.toHaveBeenCalled();
    expect(context.generateContent).toHaveBeenCalledWith({ type: "resource", title: "Review reminder" });
  });

  it.each([
    [new FetchPageError("URL_NOT_ALLOWED", "private"), 400, "URL_NOT_ALLOWED"],
    [new FetchPageError("FETCH_FAILED", "private"), 422, "FETCH_FAILED"],
    [new GenerationError("GENERATION_FAILED", "private"), 502, "GENERATION_FAILED"],
    [new GenerationError("INVALID_RESPONSE", "private"), 502, "INVALID_RESPONSE"],
  ] as const)("maps public errors", async (failure, status, code) => {
    const context = setup();
    if (failure instanceof FetchPageError) context.fetchPageContext.mockRejectedValueOnce(failure);
    else context.generateContent.mockRejectedValueOnce(failure);
    const input = failure instanceof FetchPageError
      ? { type: "bookmark", title: "Example", url: "https://example.com/" }
      : { type: "resource", title: "Example" };
    const response = await context.invoke(input);
    expect(response.status).toBe(status);
    await expect(response.json()).resolves.toMatchObject({ error: { code } });
  });
});

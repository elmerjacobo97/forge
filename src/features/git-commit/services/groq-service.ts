import { getGroqApiKey, getGroqModel } from "@/features/settings/hooks/use-settings";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

/**
 * Reasoning models (Qwen3, GPT-OSS) burn max_tokens on a hidden <think>
 * pass before answering, which truncates short-output tasks like a commit
 * subject line. Dial reasoning down per model family instead of relying on
 * the system prompt (reasoning models ignore "don't think" instructions).
 * See https://console.groq.com/docs/reasoning
 */
function getReasoningParams(model: string): Record<string, unknown> {
  if (model.startsWith("qwen/")) {
    return { reasoning_effort: "none" };
  }
  if (model.startsWith("openai/gpt-oss")) {
    return { reasoning_effort: "low", include_reasoning: false };
  }
  return {};
}

const SYSTEM_PROMPT = `You are an expert software developer. Your task is to generate a concise, meaningful git commit message that summarizes ALL the changed files listed, not just the first ones shown.

Rules:
- Follow the Conventional Commits format: type(scope): short description
- Types: feat, fix, refactor, chore, docs, style, test, perf
- The description must be lowercase and under 72 characters total
- Base the summary on the full "Files changed" list first — the per-file diffs below it may be truncated for length, but the file list is always complete
- Do NOT include a body or footer, only the one-line subject
- Do NOT output any thinking, thoughts, reasoning, or <think> tags. Go straight to the final commit message.
- Reply ONLY with the commit message — no explanation, no code blocks, no quotes`;

export interface DiffEntry {
  path: string;
  diff: string;
}

// Total char budget for diff bodies, shared evenly across files so a
// large diff doesn't starve every file after the first few (~6000 chars
// ≈ ~1500 tokens).
const DIFF_BUDGET = 6000;
const MIN_PER_FILE_BUDGET = 300;

function buildDiffSection(entries: DiffEntry[]): string {
  const perFileBudget = Math.max(MIN_PER_FILE_BUDGET, Math.floor(DIFF_BUDGET / entries.length));

  return entries
    .map(({ path, diff }) => {
      const body =
        diff.length > perFileBudget ? diff.slice(0, perFileBudget) + "\n[... truncated ...]" : diff;
      return `--- ${path} ---\n${body}`;
    })
    .join("\n\n");
}

export async function generateCommitMessage(entries: DiffEntry[]): Promise<string> {
  const apiKey = await getGroqApiKey();
  const model = await getGroqModel();

  if (!apiKey) {
    throw new Error("Groq API key not configured. Go to Settings → AI to add your key.");
  }

  const nonEmpty = entries.filter((e) => e.diff.trim());
  if (nonEmpty.length === 0) {
    throw new Error("No diff content to generate a commit message from.");
  }

  const fileList = nonEmpty.map((e) => `- ${e.path}`).join("\n");
  const diffSection = buildDiffSection(nonEmpty);

  const userContent = `Files changed (${nonEmpty.length}):\n${fileList}\n\nDiffs (may be truncated per-file):\n\`\`\`diff\n${diffSection}\n\`\`\``;

  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userContent },
      ],
      max_tokens: 2048,
      temperature: 0.3,
      ...getReasoningParams(model),
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Groq API error (${response.status}): ${err}`);
  }

  const data = (await response.json()) as any;

  let message = data.choices?.[0]?.message?.content?.trim() || "";

  // Strip <think>...</think> tags if present in the content (common in Qwen/DeepSeek reasoning models)
  if (message.includes("<think>")) {
    const thinkEnd = message.indexOf("</think>");
    if (thinkEnd !== -1) {
      message = message.slice(thinkEnd + 8).trim();
    } else {
      // If thinking was cut off and has no closing tag, try to find a conventional commit pattern
      // or default to clean output
      message = message.replace(/<think>[\s\S]*/, "").trim();
    }
  }

  // Remove any markdown code block formatting (e.g. ```commit ... ```)
  message = message.replace(/^```[a-z]*\n/i, "").replace(/\n```$/, "");
  // Remove wrapping double quotes if the model wrapped the response in quotes
  message = message.replace(/^"|"$/g, "").trim();

  if (!message) {
    if (data.choices?.[0]?.finish_reason === "length") {
      throw new Error(
        "Groq cut off the response while reasoning (hit the token limit before answering). Try again or switch models in Settings → AI.",
      );
    }
    throw new Error(
      `Groq returned an empty response or unexpected format. Full response: ${JSON.stringify(
        data,
      )}`,
    );
  }

  return message;
}

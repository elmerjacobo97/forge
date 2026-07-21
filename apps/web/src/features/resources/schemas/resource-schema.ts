import { z } from "zod";

const baseResourceSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters."),
  kind: z.enum(["note", "prompt", "config", "code"]),
  content: z.string().min(1, "Content is required."),
  language: z.string(),
  tagsString: z.string(),
  tool: z.union([
    z.enum(["react-native", "vscode", "cursor", "opencode", "claude-code", "other"]),
    z.literal(""),
  ]),
  customTool: z.string(),
  version: z.string(),
  context: z.string(),
});

function addConditionalIssues(
  value: z.infer<typeof baseResourceSchema>,
  context: z.RefinementCtx,
  requireTool: boolean,
): void {
  if (requireTool && value.kind === "config" && !value.tool) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["tool"],
      message: "Tool is required for configurations.",
    });
  }

  if (value.tool === "other" && !value.customTool?.trim()) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["customTool"],
      message: "Custom tool name is required when selecting Other.",
    });
  }
}

export const resourceSchema = baseResourceSchema.superRefine((value, context) => {
  addConditionalIssues(value, context, true);
});

export const editResourceSchema = baseResourceSchema.superRefine((value, context) => {
  addConditionalIssues(value, context, false);
});

export type ResourceSchema = z.infer<typeof resourceSchema>;

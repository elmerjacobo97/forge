import { z } from "zod";

const ideaStatusSchema = z.enum(["seed", "exploring", "building", "parked", "shipped"]);
const ideaCategorySchema = z.enum(["app", "web", "mobile", "business", "other"]);

const baseIdeaSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters."),
  content: z.string().min(1, "Content is required."),
  status: ideaStatusSchema,
  category: ideaCategorySchema,
  tagsString: z.string(),
  linksString: z.string(),
});

export const ideaSchema = baseIdeaSchema;

export type IdeaSchema = z.infer<typeof ideaSchema>;

export const ideaInputSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters."),
  content: z.string().min(1, "Content is required."),
  status: ideaStatusSchema,
  category: ideaCategorySchema,
  tags: z.array(z.string()),
  links: z
    .array(z.string().trim().url("Links must be valid URLs."))
    .max(10, "Links must be at most 10."),
});

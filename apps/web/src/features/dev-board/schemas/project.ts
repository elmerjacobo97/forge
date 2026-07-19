import { z } from "zod";

export const projectSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(80, "Name is too long"),
  description: z
    .string()
    .trim()
    .max(2000, "Description is too long")
    .default(""),
});

export type ProjectFormValues = z.infer<typeof projectSchema>;

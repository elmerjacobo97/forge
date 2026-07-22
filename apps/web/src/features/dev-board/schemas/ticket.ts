import { z } from "zod";

import { PRIORITIES } from "../types/board";

export const ticketSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(120, "Title is too long"),
  description: z.string().trim().max(2000, "Description is too long").max(2000),
  priority: z.enum(PRIORITIES),
});

export type TicketFormValues = z.infer<typeof ticketSchema>;

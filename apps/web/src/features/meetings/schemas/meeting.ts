import { z } from "zod";

export const meetingSchema = z.object({
  projectId: z.uuid().nullable(),
  title: z
    .string()
    .trim()
    .min(1, "Title is required.")
    .max(200, "Title must be at most 200 characters."),
  meetingAt: z.iso.datetime(),
  attendees: z.array(z.string().trim().min(1)),
  context: z.string(),
  decisions: z.array(z.string().trim().min(1)),
});

export type MeetingInput = z.infer<typeof meetingSchema>;

export const meetingActionItemSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Action item title is required.")
    .max(120, "Action item title must be at most 120 characters."),
  details: z.string().trim().max(2000, "Action item details must be at most 2000 characters."),
  responsibleName: z
    .string()
    .trim()
    .max(120, "Responsible name must be at most 120 characters.")
    .transform((value) => value || null),
  dueDate: z.iso.date().nullable(),
});

export type MeetingActionItemInput = z.infer<typeof meetingActionItemSchema>;

export const meetingFiltersSchema = z.object({
  q: z.string().trim(),
  projectId: z.uuid().nullable(),
});

export type MeetingFilters = z.infer<typeof meetingFiltersSchema>;

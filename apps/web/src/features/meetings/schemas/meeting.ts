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

function linesToValues(value: string): string[] {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

export const meetingFormSchema = meetingSchema.extend({
  projectId: z
    .union([z.literal("none"), z.uuid()])
    .transform((value) => (value === "none" ? null : value)),
  meetingAt: z
    .string()
    .min(1, "Date and time is required.")
    .refine((value) => !Number.isNaN(new Date(value).getTime()), "Enter a valid date and time.")
    .transform((value) => new Date(value).toISOString()),
  attendees: z.string().transform(linesToValues),
  decisions: z.string().transform(linesToValues),
});

export type MeetingFormValues = z.input<typeof meetingFormSchema>;

export const meetingFiltersSchema = z.object({
  q: z.string().trim(),
  projectId: z.uuid().nullable(),
});

export type MeetingFilters = z.infer<typeof meetingFiltersSchema>;

function searchParam(
  searchParams: Record<string, string | string[] | undefined>,
  key: string,
): string | undefined {
  const value = searchParams[key];
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

export function parseMeetingFilters(
  searchParams: Record<string, string | string[] | undefined>,
): MeetingFilters {
  const parsed = meetingFiltersSchema.safeParse({
    q: searchParam(searchParams, "q") ?? "",
    projectId: searchParam(searchParams, "projectId") ?? null,
  });
  return parsed.success ? parsed.data : { q: "", projectId: null };
}

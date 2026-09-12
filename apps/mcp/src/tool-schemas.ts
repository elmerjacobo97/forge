import { COLUMNS } from "@forge/core";
import { z } from "zod";

const projectIdSchema = z.string().trim().min(1, "Project id is required.");
const ticketIdSchema = z.string().trim().min(1, "Ticket id is required.");
const columnSchema = z.enum(COLUMNS);
const isoDateTimeSchema = z
  .string()
  .trim()
  .refine((value) => !Number.isNaN(Date.parse(value)), "Date must be a valid ISO 8601 timestamp.");

export const getProjectInput = {
  projectId: projectIdSchema,
};

export const listTicketsInput = {
  projectId: projectIdSchema,
  column: columnSchema.optional(),
};

export const nextTicketInput = {
  projectId: projectIdSchema.optional(),
};

export const getTicketInput = {
  ticketId: ticketIdSchema,
};

export const activityReportInput = {
  days: z.number().int().min(1).max(90).default(7),
  since: isoDateTimeSchema.optional(),
  until: isoDateTimeSchema.optional(),
  projectId: projectIdSchema.optional(),
  columns: z.array(columnSchema).optional(),
};

import { COLUMNS, PRIORITIES } from "@forge/core";
import { z } from "zod";

const projectIdSchema = z.string().trim().min(1, "Project id is required.");
const ticketIdSchema = z.string().trim().min(1, "Ticket id is required.");
const columnSchema = z.enum(COLUMNS);
const prioritySchema = z.enum(PRIORITIES);
const titleSchema = z
  .string()
  .trim()
  .min(1, "Title is required.")
  .max(120, "Title must be at most 120 characters.");
const descriptionSchema = z
  .string()
  .trim()
  .max(2000, "Description must be at most 2000 characters.");
const branchSchema = z
  .string()
  .trim()
  .min(1, "Branch must be at least 1 character.")
  .max(200, "Branch must be at most 200 characters.");
const prUrlSchema = z
  .string()
  .trim()
  .max(2048, "PR URL must be at most 2048 characters.")
  .regex(/^https?:\/\//i, "PR URL must start with http:// or https://.");
const commentBodySchema = z
  .string()
  .trim()
  .min(1, "Comment body is required.")
  .max(5000, "Comment body must be at most 5000 characters.");
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

export const createTicketInput = {
  projectId: projectIdSchema,
  title: titleSchema,
  description: descriptionSchema.default(""),
  column: columnSchema.default("backlog"),
  priority: prioritySchema.default("med"),
};

export const moveTicketInput = {
  ticketId: ticketIdSchema,
  column: columnSchema,
  branch: branchSchema.optional(),
  prUrl: prUrlSchema.optional(),
  clearBranch: z.boolean().optional(),
  clearPrUrl: z.boolean().optional(),
};

export const updateTicketInput = z
  .strictObject({
    ticketId: ticketIdSchema,
    branch: branchSchema.optional(),
    prUrl: prUrlSchema.optional(),
    clearBranch: z.boolean().optional(),
    clearPrUrl: z.boolean().optional(),
  })
  .refine(
    (value) =>
      value.branch !== undefined ||
      value.prUrl !== undefined ||
      value.clearBranch !== undefined ||
      value.clearPrUrl !== undefined,
    { message: "Provide at least one of branch, prUrl, clearBranch, or clearPrUrl." },
  );

export const addTicketCommentInput = {
  ticketId: ticketIdSchema,
  body: commentBodySchema,
};

export const ticketIdInput = {
  ticketId: ticketIdSchema,
};

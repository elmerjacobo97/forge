import { COLUMNS, PRIORITIES, ticketCreateSchema, ticketUpdateSchema } from "@forge/core";
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

export const createTicketInput = z
  .object({
    projectId: projectIdSchema,
    title: titleSchema,
    description: descriptionSchema.default(""),
    column: columnSchema.default("backlog"),
    priority: prioritySchema.default("med"),
    responsibleName: z.string().trim().min(1).max(120).optional(),
    startDate: ticketCreateSchema.shape.startDate,
    dueDate: ticketCreateSchema.shape.dueDate,
    complexity: ticketCreateSchema.shape.complexity,
  })
  .refine(
    (value) =>
      !value.startDate ||
      !value.dueDate ||
      Date.parse(value.startDate) <= Date.parse(value.dueDate),
    { message: "Start date must be on or before due date.", path: ["dueDate"] },
  );

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
    responsibleName: z.string().trim().min(1).max(120).optional(),
    clearResponsible: z.boolean().optional(),
    startDate: ticketUpdateSchema.shape.startDate,
    dueDate: ticketUpdateSchema.shape.dueDate,
    complexity: ticketUpdateSchema.shape.complexity,
    clearStartDate: ticketUpdateSchema.shape.clearStartDate,
    clearDueDate: ticketUpdateSchema.shape.clearDueDate,
    clearComplexity: ticketUpdateSchema.shape.clearComplexity,
  })
  .refine(
    (value) =>
      value.branch !== undefined ||
      value.prUrl !== undefined ||
      value.clearBranch !== undefined ||
      value.clearPrUrl !== undefined ||
      value.responsibleName !== undefined ||
      value.clearResponsible !== undefined ||
      value.startDate !== undefined ||
      value.dueDate !== undefined ||
      value.complexity !== undefined ||
      value.clearStartDate !== undefined ||
      value.clearDueDate !== undefined ||
      value.clearComplexity !== undefined,
    {
      message: "Provide at least one handoff, responsible-name, or planning field to update.",
    },
  )
  .refine((value) => !(value.responsibleName !== undefined && value.clearResponsible === true), {
    message: "Use either responsibleName or clearResponsible, not both.",
  })
  .superRefine((value, context) => {
    const planningFields = [
      ["startDate", "clearStartDate", "Start Date"],
      ["dueDate", "clearDueDate", "Due Date"],
      ["complexity", "clearComplexity", "Complexity"],
    ] as const;

    for (const [field, clearField, label] of planningFields) {
      if (value[field] !== undefined && value[clearField] === true) {
        context.addIssue({
          code: "custom",
          path: [field],
          message: `Cannot set and clear ${label} in the same update.`,
        });
      }
    }

    if (
      value.startDate !== undefined &&
      value.dueDate !== undefined &&
      Date.parse(value.startDate) > Date.parse(value.dueDate)
    ) {
      context.addIssue({
        code: "custom",
        path: ["dueDate"],
        message: "Start date must be on or before due date.",
      });
    }
  });

export const addTicketCommentInput = {
  ticketId: ticketIdSchema,
  body: commentBodySchema,
};

export const ticketIdInput = {
  ticketId: ticketIdSchema,
};

const durationSchema = z.string().trim().min(1, "Duration must not be empty.");

export const adjustTicketTimeInput = {
  ticketId: ticketIdSchema,
  set: durationSchema.optional(),
  setTotal: durationSchema.optional(),
  removeLast: z.boolean().optional(),
  stopAt: z.string().trim().min(1).optional(),
  stopWith: durationSchema.optional(),
};

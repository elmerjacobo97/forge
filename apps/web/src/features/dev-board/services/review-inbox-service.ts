import "server-only";

import { z } from "zod";

import { createInsForgeServerClient } from "@/lib/insforge/server";
import { PROJECT_STATUSES } from "../types/project";
import { REVIEW_INBOX_COLUMNS, type ReviewInboxItem } from "../types/review-inbox";
import { reviewInboxExcerpt, sortReviewInboxItems } from "../utils/review-inbox";

const ticketRowSchema = z.object({
  id: z.string(),
  project_id: z.string(),
  title: z.string(),
  column_id: z.enum(REVIEW_INBOX_COLUMNS),
  pr_url: z.string().nullable(),
  last_moved_at: z.string(),
});

const projectRowSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: z.enum(PROJECT_STATUSES),
});

const commentRowSchema = z.object({
  ticket_id: z.string(),
  body: z.string(),
  author: z.enum(["user", "agent"]),
  created_at: z.string(),
});

type CommentRow = z.infer<typeof commentRowSchema>;

const TICKET_COLUMNS = "id,project_id,title,column_id,pr_url,last_moved_at";
const PROJECT_COLUMNS = "id,name,status";
const COMMENT_COLUMNS = "ticket_id,body,author,created_at";

function failure(error: { message?: string } | null, fallback: string): Error {
  return new Error(error?.message || fallback);
}

function latestCommentByTicket(comments: CommentRow[]): Map<string, CommentRow> {
  const latest = new Map<string, CommentRow>();
  for (const comment of comments) {
    const current = latest.get(comment.ticket_id);
    if (!current || comment.created_at > current.created_at) {
      latest.set(comment.ticket_id, comment);
    }
  }
  return latest;
}

export async function listReviewInbox(): Promise<ReviewInboxItem[]> {
  const insforge = await createInsForgeServerClient();
  const { data: ticketData, error: ticketError } = await insforge.database
    .from("dev_board_tickets")
    .select(TICKET_COLUMNS)
    .in("column_id", [...REVIEW_INBOX_COLUMNS]);
  if (ticketError) throw failure(ticketError, "Failed to load review inbox.");

  const tickets = ticketRowSchema.array().parse(ticketData);
  if (tickets.length === 0) return [];

  const projectIds = [...new Set(tickets.map((ticket) => ticket.project_id))];
  const { data: projectData, error: projectError } = await insforge.database
    .from("dev_board_projects")
    .select(PROJECT_COLUMNS)
    .in("id", projectIds);
  if (projectError) throw failure(projectError, "Failed to load review inbox.");

  const projects = new Map(
    projectRowSchema
      .array()
      .parse(projectData)
      .map((project) => [project.id, project]),
  );
  const visible = tickets.filter((ticket) => {
    const project = projects.get(ticket.project_id);
    return project !== undefined && project.status !== "archived";
  });
  if (visible.length === 0) return [];

  const { data: commentData, error: commentError } = await insforge.database
    .from("dev_board_ticket_comments")
    .select(COMMENT_COLUMNS)
    .in(
      "ticket_id",
      visible.map((ticket) => ticket.id),
    );
  if (commentError) throw failure(commentError, "Failed to load review inbox.");

  const comments = latestCommentByTicket(commentRowSchema.array().parse(commentData));
  const items = visible.map((ticket) => {
    const project = projects.get(ticket.project_id);
    const comment = comments.get(ticket.id);
    if (!project) throw new Error("Failed to load review inbox.");
    return {
      ticketId: ticket.id,
      projectId: ticket.project_id,
      projectName: project.name,
      title: ticket.title,
      column: ticket.column_id,
      prUrl: ticket.pr_url,
      lastMovedAt: ticket.last_moved_at,
      comment: comment
        ? { author: comment.author, excerpt: reviewInboxExcerpt(comment.body) }
        : null,
    };
  });

  return sortReviewInboxItems(items);
}

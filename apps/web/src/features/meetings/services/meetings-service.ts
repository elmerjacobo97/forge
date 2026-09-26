import "server-only";

import { z } from "zod";

import { createInsForgeServerClient } from "@/lib/insforge/server";
import { ticketRowSchema, toTicket } from "@/features/dev-board/utils/ticket-row";
import type { Ticket } from "@/features/dev-board/types/board";
import type { MeetingActionItemInput, MeetingFilters, MeetingInput } from "../schemas/meeting";
import type { Meeting, MeetingActionItem, MeetingDetail, MeetingsPage } from "../types";
import { buildMeetingSearchFilter } from "../utils/query-filters";

const meetingRowSchema = z.object({
  id: z.string(),
  project_id: z.string().nullable(),
  title: z.string(),
  meeting_at: z.string(),
  attendees: z.array(z.string()),
  context: z.string(),
  decisions: z.array(z.string()),
  created_at: z.string(),
  updated_at: z.string(),
});

const actionItemRowSchema = z.object({
  id: z.string(),
  meeting_id: z.string(),
  title: z.string(),
  details: z.string(),
  responsible_name: z.string().nullable(),
  due_date: z.string().nullable(),
  is_completed: z.boolean(),
  ticket_id: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

const MEETING_COLUMNS =
  "id,project_id,title,meeting_at,attendees,context,decisions,created_at,updated_at";
const ACTION_ITEM_COLUMNS =
  "id,meeting_id,title,details,responsible_name,due_date,is_completed,ticket_id,created_at,updated_at";

function toMeeting(value: unknown): Meeting {
  const row = meetingRowSchema.parse(value);
  return {
    id: row.id,
    projectId: row.project_id,
    title: row.title,
    meetingAt: row.meeting_at,
    attendees: row.attendees,
    context: row.context,
    decisions: row.decisions,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toActionItem(value: unknown): MeetingActionItem {
  const row = actionItemRowSchema.parse(value);
  return {
    id: row.id,
    meetingId: row.meeting_id,
    title: row.title,
    details: row.details,
    responsibleName: row.responsible_name,
    dueDate: row.due_date,
    isCompleted: row.is_completed,
    ticketId: row.ticket_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function failure(error: { message?: string } | null, fallback: string): Error {
  return new Error(error?.message || fallback);
}

function meetingPayload(meeting: MeetingInput) {
  return {
    project_id: meeting.projectId,
    title: meeting.title,
    meeting_at: meeting.meetingAt,
    attendees: meeting.attendees,
    context: meeting.context,
    decisions: meeting.decisions,
  };
}

function actionItemPayload(item: MeetingActionItemInput) {
  return {
    title: item.title,
    details: item.details,
    responsible_name: item.responsibleName,
    due_date: item.dueDate,
  };
}

export const meetingsService = {
  async fetchMeetingsPage(
    filters: MeetingFilters,
    offset: number,
    limit: number,
  ): Promise<MeetingsPage> {
    if (!Number.isSafeInteger(offset) || offset < 0) {
      throw new Error("Meeting offset must be a non-negative integer.");
    }
    if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100) {
      throw new Error("Meeting page size must be between 1 and 100.");
    }

    const insforge = await createInsForgeServerClient();
    let query = insforge.database.from("meetings").select(MEETING_COLUMNS, { count: "exact" });
    if (filters.projectId) query = query.eq("project_id", filters.projectId);
    const search = filters.q.trim();
    if (search) query = query.or(buildMeetingSearchFilter(search));

    const { data, error, count } = await query
      .order("meeting_at", { ascending: false })
      .order("id", { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) throw failure(error, "Failed to load meetings.");

    return {
      meetings: meetingRowSchema.array().parse(data).map(toMeeting),
      total: count ?? 0,
    };
  },

  async getMeeting(meetingId: string): Promise<MeetingDetail | null> {
    const insforge = await createInsForgeServerClient();
    const { data, error } = await insforge.database
      .from("meetings")
      .select(MEETING_COLUMNS)
      .eq("id", meetingId)
      .maybeSingle();
    if (error) throw failure(error, "Failed to load meeting.");
    if (!data) return null;

    const { data: actionItemsData, error: actionItemsError } = await insforge.database
      .from("meeting_action_items")
      .select(ACTION_ITEM_COLUMNS)
      .eq("meeting_id", meetingId)
      .order("created_at", { ascending: true })
      .order("id", { ascending: true });
    if (actionItemsError) throw failure(actionItemsError, "Failed to load meeting action items.");

    return {
      ...toMeeting(data),
      actionItems: actionItemRowSchema.array().parse(actionItemsData).map(toActionItem),
    };
  },

  async createMeeting(input: MeetingInput): Promise<Meeting> {
    const insforge = await createInsForgeServerClient();
    const { data, error } = await insforge.database
      .from("meetings")
      .insert([meetingPayload(input)])
      .select(MEETING_COLUMNS)
      .single();
    if (error) throw failure(error, "Failed to create meeting.");
    return toMeeting(data);
  },

  async updateMeeting(meetingId: string, input: MeetingInput): Promise<Meeting> {
    const insforge = await createInsForgeServerClient();
    const { data, error } = await insforge.database
      .from("meetings")
      .update(meetingPayload(input))
      .eq("id", meetingId)
      .select(MEETING_COLUMNS)
      .single();
    if (error) throw failure(error, "Failed to update meeting.");
    return toMeeting(data);
  },

  async deleteMeeting(meetingId: string): Promise<void> {
    const insforge = await createInsForgeServerClient();
    const { error } = await insforge.database.from("meetings").delete().eq("id", meetingId);
    if (error) throw failure(error, "Failed to delete meeting.");
  },

  async createActionItem(
    meetingId: string,
    input: MeetingActionItemInput,
  ): Promise<MeetingActionItem> {
    const insforge = await createInsForgeServerClient();
    const { data, error } = await insforge.database
      .from("meeting_action_items")
      .insert([{ meeting_id: meetingId, ...actionItemPayload(input) }])
      .select(ACTION_ITEM_COLUMNS)
      .single();
    if (error) throw failure(error, "Failed to create meeting action item.");
    return toActionItem(data);
  },

  async updateActionItem(
    actionItemId: string,
    input: MeetingActionItemInput,
  ): Promise<MeetingActionItem> {
    const insforge = await createInsForgeServerClient();
    const { data, error } = await insforge.database
      .from("meeting_action_items")
      .update(actionItemPayload(input))
      .eq("id", actionItemId)
      .select(ACTION_ITEM_COLUMNS)
      .single();
    if (error) throw failure(error, "Failed to update meeting action item.");
    return toActionItem(data);
  },

  async setActionItemCompleted(
    actionItemId: string,
    isCompleted: boolean,
  ): Promise<MeetingActionItem> {
    const insforge = await createInsForgeServerClient();
    const { data: currentData, error: currentError } = await insforge.database
      .from("meeting_action_items")
      .select("id,ticket_id")
      .eq("id", actionItemId)
      .maybeSingle();
    if (currentError) throw failure(currentError, "Failed to update meeting action item.");
    if (!currentData) throw new Error("Meeting action item not found.");
    const current = z
      .object({ id: z.string(), ticket_id: z.string().nullable() })
      .parse(currentData);
    if (current.ticket_id) {
      throw new Error("Linked action item progress is tracked in Dev Board.");
    }

    const { data, error } = await insforge.database
      .from("meeting_action_items")
      .update({ is_completed: isCompleted })
      .eq("id", actionItemId)
      .is("ticket_id", null)
      .select(ACTION_ITEM_COLUMNS)
      .maybeSingle();
    if (error) throw failure(error, "Failed to update meeting action item.");
    if (!data) throw new Error("Linked action item progress is tracked in Dev Board.");
    return toActionItem(data);
  },

  async deleteActionItem(actionItemId: string): Promise<void> {
    const insforge = await createInsForgeServerClient();
    const { error } = await insforge.database
      .from("meeting_action_items")
      .delete()
      .eq("id", actionItemId);
    if (error) throw failure(error, "Failed to delete meeting action item.");
  },

  async createTicketFromActionItem(
    actionItemId: string,
    projectId?: string | null,
  ): Promise<Ticket> {
    const insforge = await createInsForgeServerClient();
    const { data, error } = await insforge.database.rpc(
      "create_dev_board_ticket_from_meeting_action",
      { p_action_item_id: actionItemId, p_project_id: projectId ?? null },
    );
    if (error) throw failure(error, "Failed to create ticket from meeting action item.");
    return toTicket(ticketRowSchema.parse(Array.isArray(data) ? data[0] : data));
  },
};

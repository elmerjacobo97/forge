import "server-only";

import { z } from "zod";

import { createInsForgeServerClient } from "@/lib/insforge/server";
import type { MeetingFilters, MeetingInput } from "../schemas/meeting";
import type { Meeting, MeetingsPage } from "../types";
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

const MEETING_COLUMNS =
  "id,project_id,title,meeting_at,attendees,context,decisions,created_at,updated_at";

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

  async getMeeting(meetingId: string): Promise<Meeting | null> {
    const insforge = await createInsForgeServerClient();
    const { data, error } = await insforge.database
      .from("meetings")
      .select(MEETING_COLUMNS)
      .eq("id", meetingId)
      .maybeSingle();
    if (error) throw failure(error, "Failed to load meeting.");
    if (!data) return null;
    return toMeeting(data);
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
    const { data, error } = await insforge.database
      .from("meetings")
      .delete()
      .eq("id", meetingId)
      .select("id");
    if (error) throw failure(error, "Failed to delete meeting.");
    if (!data || data.length === 0) throw new Error("Meeting not found.");
  },
};

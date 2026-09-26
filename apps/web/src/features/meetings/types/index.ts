export interface Meeting {
  id: string;
  projectId: string | null;
  title: string;
  meetingAt: string;
  attendees: string[];
  context: string;
  decisions: string[];
  createdAt: string;
  updatedAt: string;
}

export interface MeetingActionItem {
  id: string;
  meetingId: string;
  title: string;
  details: string;
  responsibleName: string | null;
  dueDate: string | null;
  isCompleted: boolean;
  ticketId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MeetingLinkedTicket {
  id: string;
  projectId: string;
  title: string;
  column: "backlog" | "todo" | "in_progress" | "validation" | "review" | "done";
}

export interface MeetingActionItemWithTicket extends MeetingActionItem {
  linkedTicket: MeetingLinkedTicket | null;
}

export interface MeetingDetail extends Meeting {
  actionItems: MeetingActionItemWithTicket[];
}

export interface MeetingsPage {
  meetings: Meeting[];
  total: number;
}

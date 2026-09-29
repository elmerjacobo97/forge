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

export interface MeetingsPage {
  meetings: Meeting[];
  total: number;
}

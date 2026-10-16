export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  projectId: string | null;
  createdAt: string;
}

export interface NoteProject {
  id: string;
  name: string;
}

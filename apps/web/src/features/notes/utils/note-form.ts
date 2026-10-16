import { NO_PROJECT } from "../schemas/note-schema";

export function projectIdFromValue(value: string): string | null {
  return value === NO_PROJECT ? null : value;
}

export function projectValueFromId(projectId: string | null): string {
  return projectId ?? NO_PROJECT;
}

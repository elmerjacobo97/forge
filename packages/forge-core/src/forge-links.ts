import type { Project, Resource, Ticket } from "./types.js";

export const FORGE_WEB_URL = "https://forge.elmerjacobo.dev";

export function projectForgeUrl(project: Pick<Project, "id">): string {
  return `${FORGE_WEB_URL}/dev-board/${project.id}`;
}

export function ticketForgeUrl(ticket: Pick<Ticket, "id" | "projectId">): string {
  return `${FORGE_WEB_URL}/dev-board/${ticket.projectId}?ticket=${ticket.id}`;
}

export function resourceForgeUrl(resource: Pick<Resource, "title">): string {
  return `${FORGE_WEB_URL}/resources?q=${encodeURIComponent(resource.title)}`;
}

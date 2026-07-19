export const PROJECT_HAS_TICKETS_MESSAGE =
  "Cannot delete a project that still has tickets. Delete its tickets first.";

export function assertProjectHasNoTickets(ticketCount: number): void {
  if (ticketCount > 0) {
    throw new Error(PROJECT_HAS_TICKETS_MESSAGE);
  }
}

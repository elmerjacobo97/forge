import { UPTIME_MAX_MONITORS_PER_USER } from "../constants";

export class UptimeMonitorLimitError extends Error {
  constructor(message = `You can have at most ${UPTIME_MAX_MONITORS_PER_USER} monitors.`) {
    super(message);
    this.name = "UptimeMonitorLimitError";
  }
}

export function assertCanCreateMonitor(existingCount: number): void {
  if (existingCount >= UPTIME_MAX_MONITORS_PER_USER) {
    throw new UptimeMonitorLimitError();
  }
}

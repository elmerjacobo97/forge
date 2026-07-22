import {
  WEBHOOK_ENDPOINT_TTL_MS,
  WEBHOOK_MAX_ENDPOINTS_PER_USER,
} from "../constants";

export class WebhookEndpointLimitError extends Error {
  constructor(message = `You can have at most ${WEBHOOK_MAX_ENDPOINTS_PER_USER} active webhook endpoints.`) {
    super(message);
    this.name = "WebhookEndpointLimitError";
  }
}

export function assertCanCreateEndpoint(activeCount: number): void {
  if (activeCount >= WEBHOOK_MAX_ENDPOINTS_PER_USER) {
    throw new WebhookEndpointLimitError();
  }
}

export function isEndpointExpired(expiresAt: string, now: Date = new Date()): boolean {
  return Date.parse(expiresAt) <= now.getTime();
}

export function buildEndpointExpiresAt(now: Date = new Date()): string {
  return new Date(now.getTime() + WEBHOOK_ENDPOINT_TTL_MS).toISOString();
}

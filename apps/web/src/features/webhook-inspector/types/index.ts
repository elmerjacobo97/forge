export type WebhookEndpoint = {
  id: string;
  userId: string;
  token: string;
  name: string;
  expiresAt: string;
  createdAt: string;
};

export type WebhookEvent = {
  id: string;
  endpointId: string;
  method: string;
  path: string;
  headers: Record<string, string>;
  body: string;
  bodyTruncated: boolean;
  sourceIp: string | null;
  userAgent: string | null;
  receivedAt: string;
};

export type WebhookRateLimit = {
  token: string;
  windowStart: string;
  requestCount: number;
};
